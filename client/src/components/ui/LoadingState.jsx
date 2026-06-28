function LoadingState({ title = "Loading", message = "Please wait while we fetch the latest data.", cards = 3 }) {
  return (
    <section className="state-card">
      <div>
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
      <div className="state-skeleton-grid" aria-hidden="true">
        {Array.from({ length: cards }).map((_, index) => (
          <span className="state-skeleton" key={index} />
        ))}
      </div>
    </section>
  );
}

export default LoadingState;
