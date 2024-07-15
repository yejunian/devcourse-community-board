import { HttpMethod, convertToBody, httpRequest } from "../api";

export const sendPostLoginRequest = async (body: object) => {
  return await httpRequest("user/login", HttpMethod.POST, convertToBody(body));
};