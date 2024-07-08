import axios from "axios";
import { toast } from "react-toastify";

const API = axios.create({
    baseURL: 'http://localhost:3000/api'
})

API.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      config.headers = {
        ...config.headers,
        "Authorization": `Bearer ${token}`
      }    
      return (config);
    },
    function (error) {
      return Promise.reject(error);
    }
  );

  API.interceptors.response.use(
    function (response) {
      return response.data;
    },
    function (error) {
      if(error.response){      
        const {status} = error.response;
        if (status === 401){
          localStorage.removeItem('token');
          toast.error('Session expired. Please log in again.');
          window.location.href = '/login';
        }
      }
      console.log(error.response);
      
      return Promise.reject(error.response.data);
    }
  );

export default API;