// Tavus deployment for the AI interviewer. Not a secret: the browser loads the
// deployment with this id alone. Persona, allowed origins, daily limits and the
// device check are set on the deployment in the Tavus portal, not here.
export const TAVUS_DEPLOYMENT_ID = "27cedacf-2320-4c40-9b8a-8def9afda63a";

/** Tool on the PAL that lets the interviewer end the call (spec in README). */
export const END_INTERVIEW_TOOL = "end_interview";
