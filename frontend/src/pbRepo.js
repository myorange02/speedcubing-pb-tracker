import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export async function savePB3x3({ singleMs, ao5Ms }) { // milliseconds
    const uid = getAuth().currentUser?.uid;
    if (!uid) throw new Error("Not signed in");
    const db = getFirestore();
    const ref = doc(db, "users", uid, "pb3x3", "best");
    await setDoc(ref, { singleMs, ao5Ms, updateAt: serverTimestamp() }, { merge: true});
}