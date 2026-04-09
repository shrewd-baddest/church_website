import { Link } from "react-router-dom";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";
import { SiGithub } from "react-icons/si";

const Footers = () => {

  const socialMedia = [
    { icon: <FaFacebook />, url: "https://facebook.com/YourPage", color: "#1877F2", name: "Facebook" },
    { icon: <FaTwitter />, url: "https://twitter.com/YourPage", color: "#1DA1F2", name: "Twitter" },
    { icon: <FaInstagram />, url: "https://instagram.com/YourPage", color: "#E1306C", name: "Instagram" },
    { icon: <FaLinkedin />, url: "https://linkedin.com/in/YourPage", color: "#0A66C2", name: "LinkedIn" },
    { icon: <SiGithub />, url: "https://github.com/YourProfile", color: "#333", name: "GitHub" },
  ];
  return (
    <div className="flex flex-col items-center justify-center gap-8 px-[8%] py-12 bg-gray-100 text-center ">
      <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-4">
        <section className="flex flex-col items-center gap-4">
          <h2 className="text-xl text-blue-500 font-semi-bold">CSA Kirinyaga</h2>
          <p>Growing Together in Faith and Service</p>
        </section>
        <section className="flex flex-col items-center gap-4">
          <h2 className="text-xl text-blue-500 font-semi-bold">About CSA</h2>
          <ul>
            <Link to="/mission"> <li className="hover:font-semibold">Our Mission</li></Link>
            <Link to="/values"> <li className="hover:font-semibold">Our Values</li></Link>
            <Link to="/history"> <li className="hover:font-semibold">Our History</li></Link>
          </ul>
        </section>
        <section className="flex flex-col items-center gap-4">
          <h2 className="text-xl text-blue-500 font-semi-bold">Resources</h2>
          <ul>
            <Link to="/resources" ><li className="hover:font-semibold">View Resources</li></Link>
            <Link to="/devotions/readings"><li className="hover:font-semibold">Daily Readings</li></Link>
            <Link to="/contact"><li className="hover:font-semibold">Saints Info</li></Link>

          </ul>
        </section>
        <section className="flex flex-col items-center gap-4">
          <h2 className="text-xl text-blue-500 font-semi-bold">Connect</h2>
          <ul>
            {socialMedia.map((platform, index) => (
              <li key={index}>
                <a href={platform.url} target="_blank" className="flex items-center gap-2">
                  {platform.icon}
                  <span className="text-sm hover:font-semibold">{platform.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <h2 className="text-sm text-gray-600">© 2026 CSA Kirinyaga. All rights reserved.</h2>
    </div>
  )
};

export default Footers;
