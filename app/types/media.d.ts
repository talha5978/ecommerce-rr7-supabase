import { ApiError } from "~/utils/ApiError";


export interface MediaData {
    id: string;
    path: string;
    fullPath: string;
}

export interface UploadMediaResponse {
    data: MediaData;
}