/**
 * Redirects to the last saved form step, or the first step if no draft exists.
 */

import { Navigate } from "react-router-dom";
import { loadDraft } from "../../pages/Form/model/draftStorage";

export default function ResumeFromSave() {
  const draft = loadDraft(localStorage);

  const lastPath = draft?.lastPath;
  const safeTarget = lastPath && lastPath.startsWith("/form/") ? lastPath : "/form/personal-details";

  return <Navigate to={safeTarget} replace />;
}
