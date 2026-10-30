export function FeedbackModerationPanel() {
  return (
    <section className="admin-panel feedback-admin-panel" aria-labelledby="feedback-admin-title">
      <div className="admin-panel-heading">
        <div>
          <h2 id="feedback-admin-title">Studio letterbox</h2>
          <p>Ratings and notes submitted from the public storefront.</p>
        </div>
        <span className="feedback-storage-badge" role="status">Storage unavailable</span>
      </div>
      <div className="feedback-admin-empty">
        <span className="feedback-admin-mark" aria-hidden="true">KC</span>
        <div>
          <h3>Shared feedback storage is not connected.</h3>
          <p>Neon was not enabled for this project, so there are no shared submissions to review. Hide and delete controls will be available when real feedback can be loaded safely.</p>
          <p className="feedback-admin-note">No sample entries or browser-local feedback are shown here.</p>
        </div>
      </div>
    </section>
  )
}
