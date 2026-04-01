export default function TestPage() {
  return (
    <div className="p-8">
      <div className="bg-blue-500 text-white p-4 rounded-lg mb-4">
        Tailwind is working!
      </div>
      <div className="bg-slate-800 text-white p-4 rounded-lg">
        Dark mode test
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-red-500 p-4 rounded">Red</div>
        <div className="bg-green-500 p-4 rounded">Green</div>
        <div className="bg-purple-500 p-4 rounded">Purple</div>
      </div>
    </div>
  );
}