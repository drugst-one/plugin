export interface LogMessage {
    component: string;
    message: string;
    time: Date;
    details?: unknown;
}
