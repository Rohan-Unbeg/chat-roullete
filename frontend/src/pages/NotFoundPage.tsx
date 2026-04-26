export default function NotFoundPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center text-white p-6" style={{ background: '#0a0618' }}>
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">💀</div>
        <h1 className="text-6xl font-black font-anime mb-2">
          <span className="neon-text text-anime-primary">404</span>
        </h1>
        <p className="text-xl font-anime text-anime-accent mb-4">Page Not Found</p>
        <p className="text-gray-400 text-sm mb-8">
          This page got isekai'd to another dimension. It's not coming back.
        </p>
        <a
          href="/"
          className="anime-btn px-8 py-3 rounded-xl font-bold text-sm inline-block"
        >
          Return to Base
        </a>
      </div>
    </div>
  );
}
