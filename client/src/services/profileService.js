import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";

export const uploadProfileImage = async (file, user) => {
    const storageRef = ref(storage, `avatars/${user.uid}`);

    await uploadBytes(storageRef, file);

    const url = await getDownloadURL(storageRef);

    await updateProfile(user, {
        photoURL: url,
    });

    return url;
};