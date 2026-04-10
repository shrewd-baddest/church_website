
const Card = ({title, value,  highlight = false}: { title: string;  value: number | string; highlight?: boolean;})=> {

  return (
    <div
      className={`p-4 rounded-xl ${highlight ? "from-blue-500 to-indigo-600 text-white" : "from-gray-800 to-gray-700 text-gray-200"}`}
    >
      <p className="text-sm opacity-70">{title}</p>
      <h2 className="text-xl font-bold">{value}</h2>
    </div>
  );
}

export default Card
