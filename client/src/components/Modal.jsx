export default function Modal({ title, children }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}
