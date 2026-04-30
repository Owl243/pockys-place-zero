import { updateProfile } from "firebase/auth";

export const uploadProfileImage = async (file, user) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary no está configurado en el archivo .env");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "avatars");

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
            method: "POST",
            body: formData,
        }
    );

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error?.message || "Error al subir a Cloudinary");
    }

    const url = data.secure_url;

    // Actualizamos el perfil de Firebase Auth con la URL de Cloudinary
    await updateProfile(user, {
        photoURL: url,
    });

    return url;
};

export const updateDisplayName = async (user, name) => {
    await updateProfile(user, { displayName: name });
};