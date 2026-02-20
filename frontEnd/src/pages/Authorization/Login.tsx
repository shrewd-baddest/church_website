import React, { useState } from "react";
 import axios from "axios";
import { useNavigate } from "react-router-dom";
 import onsoo from '../assets/Images/futuristic-sports-car-qx65b3sxm4ed6g6v.jpg'
const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [passWord, setPassword] = useState<string>("");
  const [user,setUser]=useState<string>("");

  const navigate = useNavigate();


  const submit = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3000/authorisation/login",
        {
          user,
          passWord,
        }
      );

      if (response.data.status === "success") {
        localStorage.setItem("token", response.data.token);
        navigate("/dashboard");
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
  };

  return (
    <div className="h-full m-0 overflow-hidden">
      <div className="grid grid-cols-2 gap-0 mt-0 rounded-lg h-fit bg-slate-50">
        <div>
          <h3 className="mt-0 mb-10 ml-2 text-sm font-bold text-black">
            Kirinyaga Catholic Student Associations
          </h3>

          <div className="flex flex-col items-center justify-start pb-5 pl-20">
            <h1 className="mt-2 mb-4 text-4xl font-bold">
              Holla,
              <br /> Welcome Back
            </h1>

            <p className="mb-16 text-sm text-teal-950">
              Hey, Welcome back to your special place
            </p>

            <div className="grid grid-cols-1 font-semibold">
              <div>
                <label>User Name:</label>
                <input
                  type="text"
                  className="lg:w-[100%]"
                  onChange={(e) => setUser(e.target.value)}
                />
              </div>

              <div>
                <label>Password:</label>
                <input
                  type="password"
                  className="lg:w-[100%]"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <input type="checkbox" />
                <label>Remember me</label>
              </div>

              <input
                type="button"
                value="Sign in"
                onClick={submit}
                className="text-lg bg-blue-700 cursor-pointer text-cyan-100"
              />

              <p className="my-8 text-sm text-center text-teal-950">
                Forget password?
              </p>

              <input
                type="button"
                value="Reset Password"
                onClick={() => navigate('/reset')}
                className="text-lg font-bold text-black cursor-pointer bg-slate-50"
              />
            </div>
          </div>
        </div>

        <div className="h-full p-4 mt-0 mr-1 w-fit">
          <img src={onsoo} alt="car" className="h-screen cover" />
        </div>
      </div>
    </div>
  );
};

export default Login;
