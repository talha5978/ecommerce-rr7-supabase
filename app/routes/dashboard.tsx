

export const handle = {
	title: "Dashboard"
};

export const meta = [
    { title: "Dashboard", description: "Dashboard" },
]

export default function Dashboard() {
    return (
        <div>
            <h1 className="text-2xl">Dashboard</h1>
            <div className="h-1 w-full bg-gray-400"/>
            <p className="text-2xl">PROTECTED</p>
        </div>
    );
}