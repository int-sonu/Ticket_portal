export default function NotAuthorized() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1>403 – Not authorized</h1>
      <p className="text-gray-600">You don't have permission to view this page.</p>
    </div>
  );
}
