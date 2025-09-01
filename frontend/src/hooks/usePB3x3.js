import { useEffect, useState } from "react";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";

export default function usePB3x3(uid) {
    const [pb, setPb] = useState(null);

    useEffect(() => {
        if (!uid) {
            setPb(null);
            return;
        }
        const ref = doc(getFirestore(), "users", uid, "pb3x3", "best");
        const off = onSnapshot(ref,(snap) => setPb(snap.data() || null));
        return off;
    }, [uid])

    return pb;
}