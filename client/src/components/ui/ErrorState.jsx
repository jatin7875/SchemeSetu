import Button from "./Button.jsx";

function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <section className="state-card state-card-error">
      <h2>{title}</h2>
      <p>{message || "Unable to complete this request."}</p>
      {onRetry && (
        <Button type="button" onClick={onRetry}>
          Retry
        </Button>
      )}
    </section>
  );
}

export default ErrorState;
