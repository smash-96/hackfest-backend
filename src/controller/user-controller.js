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
    return res.status(200).send(uniqueID);
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

// Returns number or requests(online users) in the system
// Return type -> String
const fetchOnlineUsers = async (req, res) => {
  try {
    const requests = await firestore.collection("requests");
    const data = await requests.get();
    if (data.empty) {
      return res.status(404).send("No request found");
    } else {
      //console.log(data);
      const count = data.size.toString(); //this will exceed memory if the collections contains more documents than can fit in your memory! Reserve this method for small collections.
      return res.status(200).send(count);
    }
  } catch (error) {
    return res.status(400).send(error.message);
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
    return res.status(200).send("Request broadcasted Successfully!");
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

const checkRequests = async (req, res) => {
  try {
    const userID = req.query.userid; // Also get userid to track requests
    const requests = await firestore.collection("requests");
    let match = false;
    let match2 = false;
    let otherUserDoc;
    //return res.setHeader("Content-Type", "text/html");
    try {
      const userConnected = (await requests.doc(userID).get()).data();
      await requests
        .get()
        .then((querySnapshot) => {
          const tempDoc = [];
          querySnapshot.forEach((doc) => {
            tempDoc.push({ id: doc.id, ...doc.data() });
          });

          if (tempDoc.length !== 0) {
            if (tempDoc.length > 1) {
              if (!userConnected.connected) {
                for (let i = 0; i < tempDoc.length; i++) {
                  if (
                    tempDoc[i].connected === false &&
                    tempDoc[i].userID !== userID
                  ) {
                    otherUserDoc = tempDoc[i];
                    match = true;
                    break;
                  } else {
                    match = false;
                  }
                }
              } else {
                match2 = true;
                const connectedTo = userConnected.ConnectedTo;
                console.log("CONNECTED", [userID, connectedTo]);
                return res.send([connectedTo]);
              }
            } else {
              match2 = true;
              return res.send("No requests available3");
            }
          } else {
            match2 = true;
            return res.send("No requests available4");
          }
        })
        .catch((error) => {
          match2 = true; // for precaution
          console.log(error.message);
          return res.send(error.message);
        });
    } catch (error) {
      match2 = true; // for precaution
      console.log(error.message);
      return res.send("User not avaialble");
    }

    if (match) {
      console.log("otherUserDoc.connected", otherUserDoc.connected);
      if (userID !== null && otherUserDoc.userID !== null) {
        connect(userID, otherUserDoc.userID);
        console.log("CONNECTED", [userID, otherUserDoc.userID]);
        return res.send([otherUserDoc.userID]);
      } else {
        return res.send("No requests available1");
      }
    } else {
      if (!match2) {
        return res.send("No requests available2");
      }
    }
  } catch (error) {
    return res.send(error.message);
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
  return chatIDpre.join("_");
};
const sendMessage = async (req, res) => {
  try {
    const message = req.query.message;
    const chatterID = req.query.chatter;
    const chatteeID = req.query.chattee;
    const msgRef = firestore
      .collection("messages")
      .doc(chatID(chatterID, chatteeID));

    msgRef.collection("chats").add({
      timeStamp: new Date(),
      message: message,
      senderID: chatterID,
      recieverID: chatteeID,
    });
    return res.status(200).send("Message Sent");
  } catch (error) {
    return res.status(400).send(error.message);
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
      .get()
      .then((data) => {
        const tempDoc = [];
        data.forEach((doc) => {
          tempDoc.push({ id: doc.id, ...doc.data() });
        });

        //console.log("tempDoc", tempDoc);
        return res.status(200).send(tempDoc);
      });
  } catch (error) {
    return res.status(400).send(error.message);
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
    return res.status(200).send("User Disconnected Successfully");
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

const nextUser = async (req, res) => {
  try {
    return res.status(200).send("User Changed Successfully");
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

module.exports = {
  addUser,
  fetchOnlineUsers,
  broadcastRequest,
  checkRequests,
  sendMessage,
  fetchMessages,
  deleteRequest,
  nextUser,
};
