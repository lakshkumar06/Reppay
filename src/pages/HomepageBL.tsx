import { Link } from "react-router-dom";

const HomepageBL = () => {
    return (
      <div>
        <h1>Welcome to ZepPay</h1>
        <p>Please sign up to continue.</p>
        <a href="/signup" className="">SignUp</a>
      </div>
    );
  };
  
  export default HomepageBL;
  