import axios from 'axios';
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';

const Reset = () => {
     const [newPassword,setNewpassword]=useState<string>('')
    const [cpassword,setCpassword]=useState<string>('');
    const [match,setMatch]=useState<boolean>(true)
    const [id,setId]=useState<string>('')
    const navigate=useNavigate();
  return (
    <div>
  <form   onSubmit={(e)=>{


  e.preventDefault();

  if(newPassword!==''){

  if(newPassword==cpassword){

                const formData = new FormData(e.target);
                const payload = {
                  ...Object.fromEntries(formData.entries()),
                };


                axios.post("http://localhost:3000/authentication/reset",payload).then(
                  response=>{
                    if(response.data=="user updated successfully"){
const encoded = encodeURIComponent(id);
navigate(`/otp/${encoded}`);
                    }})}
                    else{
                     setMatch(false)
                    }}
                    else{
                      alert("please fill all the input fields");
                    }

  }}>
    <div>
<label>Enter userName:</label>
<input type="text" name='userName' onChange={(e)=>setId(e.target.value)}/>      
    </div>
  
    
    <div>
<label>Enter Email:</label>
<input type="email" name='email'  />      
    </div>
  
    <div>
<label>New PassWord:</label>
<input type="password" name='password' onChange={e=>setNewpassword(e.target.value)}/>      
    </div>

    <div>
        <label>
Confirm Password:
        </label>
        <input type="text" onChange={e=>{setCpassword(e.target.value);setMatch(true)}}/>
        <p className={`text-red-600 font-semibold ${match?'hidden':'block'}`}>no match between the passwords</p>
    </div>

    <input type="submit" value="Submit" />

  </form>

    </div>
  )
}

export default Reset