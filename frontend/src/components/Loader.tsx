const Loader = () => {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="flex space-x-2">
        <div className="w-4 h-4 rounded-full animate-bounce bg-primary [animation-delay:-0.3s]"></div>
        <div className="w-4 h-4 rounded-full animate-bounce bg-primary [animation-delay:-0.15s]"></div>
        <div className="w-4 h-4 rounded-full animate-bounce bg-primary"></div>
      </div>
    </div>
  );
};

export default Loader;
