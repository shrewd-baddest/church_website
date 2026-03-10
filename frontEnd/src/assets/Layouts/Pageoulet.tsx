import { Outlet } from "react-router-dom";
import Headers from "../../pages/Landing/components/Navigation/Navigation";
import Footers from "../../layOuts/Footers";
const Pageoulet = () => {
  return (
    <div className="flex flex-col min-h-screen" >
      <Headers />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footers />
    </div>
  );
};

export default Pageoulet;
