
// WebSocket Message Types
export const WS_EVENTS = {
    JOIN: 'join',             // C -> S: { role: 'home' | 'remote' }
    OFFER: 'offer',           // C -> S -> C: { sdp: any }
    ANSWER: 'answer',         // C -> S -> C: { sdp: any }
    CANDIDATE: 'candidate',   // C -> S -> C: { candidate: any }
    STATUS: 'status',         // S -> C: { homeOnline: boolean }
    ERROR: 'error'
} as const;

export type WsMessage =
    | { type: 'join'; payload: { role: 'home' | 'remote' } }
    | { type: 'offer'; payload: { sdp: any } }
    | { type: 'answer'; payload: { sdp: any } }
    | { type: 'candidate'; payload: { candidate: any } }
    | { type: 'status'; payload: { homeOnline: boolean } }
    | { type: 'error'; payload: { message: string } };
