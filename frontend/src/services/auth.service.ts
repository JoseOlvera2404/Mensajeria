import api from "./api";

export const requestRegisterCode = async (email: string) => {
  const res = await api.post("/auth/register-code", { email });
  return res.data;
};

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  code: string;
}) => {
  const res = await api.post("/auth/register", data);
  return res.data;
};

export const requestPasswordChangeCode = async () => {
  const res = await api.post("/auth/password-code");
  return res.data;
};

export const changePassword = async (data:{
  newPassword:string
  code:string
})=>{
  const res = await api.patch("/auth/password",data);
  return res.data;
};

export const loginUser = async (data: {
  email: string;
  password: string;
}) => {

  const res = await api.post("/auth/login", data);
  return res.data;

};