import api from "./api";

export const getCharacter = () => api.get("/api/character");
export const getCollection = () => api.get("/api/character/collection");