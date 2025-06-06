export class ApiError extends Error {
	public statusCode: number;
	public ok: false;
	public details?: any[];
    public message: string;

	/**
     * @param message     Human‐readable message (default: "Internal Server Error")
     * @param statusCode  HTTP‐style status (default: 500)
     * @param details     Optional array of extra error details
	*/

	constructor(
        message: string = "Internal Server Error", 
        statusCode: number = 500, 
        details?: any[]
    ) {
		super(message);
		Object.setPrototypeOf(this, ApiError.prototype);
        this.message = message;     // ← this line is “redundant,” but makes TS aware
		this.name = "ApiError";
		this.statusCode = statusCode;
		this.ok = false;
		if (details) this.details = details;
	}
}
