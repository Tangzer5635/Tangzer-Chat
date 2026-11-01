import { api } from "./http";
import type { CallState, IceServer } from "../types/api";

export const fetchCalls = () => api<CallState[]>("/api/calls");

export const fetchIceServers = () => api<IceServer[]>("/api/calls/ice-servers");
