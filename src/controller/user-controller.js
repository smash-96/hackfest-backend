const firebase = require("../firebase/db");
const firestore = firebase.firestore();
const { v4: uuidv4 } = require("uuid");

// Takes user information from client and saves it in DB
// Returns the userID of current user being registered
const addUser = async (req, res) => {
  try {
    const uniqueID = uuidv4().toString();
    const data = req.body;
    await firestore
      .collection("users")
      .doc(uniqueID)
      .set({
        ...data,
        uniqueID,
      });
    res.status(200).send(uniqueID);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// Returns number or requests(online users) in the system
// Return type -> String
const fetchOnlineUsers = async (req, res) => {
  try {
    const requests = await firestore.collection("requests");
    const data = await requests.get();
    if (data.empty) {
      res.status(404).send("No request found");
    } else {
      //console.log(data);
      const count = data.size.toString(); //this will exceed memory if the collections contains more documents than can fit in your memory! Reserve this method for small collections.
      res.status(200).send(count);
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const broadcastRequest = async (req, res) => {
  try {
    const userID = req.query.userid;
    await firestore.collection("requests").doc(userID).set({
      connected: false,
      userID,
      ConnectedTo: null,
    });
    res.status(200).send("Request broadcasted Successfully!");
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// Gets called on "Connect Me" button
const trackRequests = async (req, res) => {
  try {
    const userID = req.query.userid; // Also get userid to track requests
    const requests = await firestore.collection("requests");
    res.setHeader("Content-Type", "text/html");

    requests.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const userConnected = (await requests.doc(userID).get()).data()
          .connected;
        const colSize = (await requests.get()).size;
        console.log("userConnected | colSize", userConnected, colSize);

        if (!userConnected && colSize > 1) {
          const data = change.doc.data();
          console.log("data.connected", data.connected);

          if (!data.connected && data.userID !== userID) {
            console.log("data.connected", data.connected);
            //await new Promise((resolve) => setTimeout(resolve, 2000));
            connect(userID, data.userID);
            console.log("CONNECTED", [userID, data.userID]);
            // res.status(200).send([userID, data.userID]);
            res.write([userID, data.userID]);
            res.end();
          }
          // if (change.type === "modified") {
          //   console.log("MODIFIED", data);
          // }
          // if (change.type === "added") {

          //   console.log(change.doc.data(), "ADDED");
          // }
          // if (change.type === "removed") {
          //   console.log(change.doc.data(), "REMOVED");
          // }
        }
      });
    });
    //res.status(503).send("Tracking Requests");
    res.write("Tracking Requests");
  } catch (error) {
    //res.status(400).send(error.message);
    res.write(error.message);
    res.end();
  }
};

const checkRequests = async (req, res) => {
  try {
    const userID = req.query.userid; // Also get userid to track requests
    const requests = await firestore.collection("requests");
    try {
      const userConnected = (await requests.doc(userID).get()).data().connected;
      await requests.get().then((querySnapshot) => {
        const tempDoc = [];
        querySnapshot.forEach((doc) => {
          tempDoc.push({ id: doc.id, ...doc.data() });
        });

        if (tempDoc.length !== 0) {
          if (!userConnected && tempDoc.length > 1) {
            for (let i = 0; i < tempDoc.length; i++) {
              if (tempDoc[i].connected === false && tempDoc.userID !== userID) {
                console.log("tempDoc[i].connected", tempDoc[i].connected);
                //await new Promise((resolve) => setTimeout(resolve, 2000));
                connect(userID, tempDoc[i].userID);
                console.log("CONNECTED", [userID, tempDoc[i].userID]);
                res.status(200).send([userID, tempDoc[i].userID]);
                break;
              }
            }
          } else {
            res.status(503).send("No requests available");
          }
        } else {
          res.status(503).send("No requests available");
        }
      });
    } catch (error) {
      console.log(error.message);
      res.status(404).send("User not avaialble");
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const connect = async (chatterID, chatteeID) => {
  const requests = await firestore.collection("requests");
  requests.doc(chatterID).update({
    connected: true,
    ConnectedTo: chatteeID,
  });

  requests.doc(chatteeID).update({
    connected: true,
    ConnectedTo: chatterID,
  });
};

const chatID = (chatterID, chatteeID) => {
  const chatter = chatterID;
  const chattee = chatteeID;
  const chatIDpre = [];
  chatIDpre.push(chatter);
  chatIDpre.push(chattee);
  chatIDpre.sort();
  chatIDpre.join("_");
};
const sendMessage = async (req, res) => {
  try {
    const message = req.query.message;
    const chatterID = req.query.chatter;
    const chatteeID = req.query.chattee;
    //const serverTime = await firestore.FieldValue.serverTimestamp();
    const msgRef = firestore
      .collection("messages")
      .doc(chatID(chatterID, chatteeID));

    msgRef.collection("chats").add({
      timeStamp: new Date(),
      message: message,
      senderID: chatterID,
      recieverID: chatteeID,
    });
    res.status(200).send("Message Sent");
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const fetchMessages = async (req, res) => {
  try {
    const chatterID = req.query.chatter;
    const chatteeID = req.query.chattee;

    const msgList = [];
    await firestore
      .collection("messages")
      .doc(chatID(chatterID, chatteeID))
      .collection("chats")
      .orderBy("timeStamp", "desc")
      .onSnapshot((snapshot) => {
        msgList.push(snapshot.docs.map((doc) => doc.data()));
        console.log(msgList);
        res.status(200).send(msgList);
      });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const deleteRequest = async (req, res) => {
  try {
    const userID = req.query.userid;
    const requests = await firestore.collection("requests");
    const data = (await requests.doc(userID).get()).data();
    await requests.doc(data.ConnectedTo).update({
      ConnectedTo: null,
      connected: false,
    });
    await requests.doc(userID).delete();
    res.status(200).send("User Disconnected Successfully");
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const nextUser = async (req, res) => {
  try {
    res.status(200).send("User Changed Successfully");
  } catch (error) {
    res.status(400).send(error.message);
  }
};

module.exports = {
  addUser,
  fetchOnlineUsers,
  broadcastRequest,
  trackRequests,
  checkRequests,
  sendMessage,
  fetchMessages,
  deleteRequest,
  nextUser,
};
