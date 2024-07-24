const getBaseUrl = () => {
	return process.env.NODE_ENV === "development"
		? "http://localhost:5000"
		: "https://steering-explorer-server.vercel.app";
};

export const fetchCosineSim = async (index: number) => {
	console.log("fetching: " + index);
	try {
		const response = await fetch(`${getBaseUrl()}/get_cos_sim?index=${index}`);
		if (!response.ok) {
			throw new Error("Network response was not ok");
		}
		const rawData = await response.json();
		return rawData;
	} catch (error) {
		console.error("There was a problem with the fetch operation:", error);
	}
};

export const fetchDescriptions = async (keys: number[]) => {
	console.log("fetching descriptions for keys:", keys);
	try {
		const response = await fetch(`${getBaseUrl()}/get_description`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ keys }),
		});

		if (!response.ok) {
			throw new Error("Network response was not ok");
		}

		const data = await response.json();
		return data.descriptions;
	} catch (error) {
		console.error("There was a problem fetching the descriptions:", error);
		return {};
	}
};

export const fetchSearchResults = async (searchQuery: string) => {
	if (searchQuery.trim().length < 2) {
		return;
	}
	try {
		const response = await fetch(`${getBaseUrl()}/search/${searchQuery}`);
		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error fetching search results:", error);
	}
};

export const fetchTopEffects = async (feature: number) => {
	console.log("fetching top effects for feature: " + feature);
	try {
		const response = await fetch(
			`${getBaseUrl()}/get_top_effects?feature=${feature}`
		);
		if (!response.ok) {
			throw new Error("Network response was not ok");
		}
		const rawData = await response.json();
		return rawData;
	} catch (error) {
		console.error("There was a problem fetching top effects:", error);
	}
};

export const fetchTopActions = async (feature: number) => {
	console.log("fetching top actions for feature: " + feature);
	try {
		const response = await fetch(
			`${getBaseUrl()}/get_top_actions?feature=${feature}`
		);
		if (!response.ok) {
			throw new Error("Network response was not ok");
		}
		const rawData = await response.json();
		return rawData;
	} catch (error) {
		console.error("There was a problem fetching top actions:", error);
	}
};

export const fetchCoOccurringEffects = async (feature: number) => {
	console.log("fetching co-occurring effects for feature: " + feature);
	try {
		const response = await fetch(
			`${getBaseUrl()}/get_co_occurring_effects?feature=${feature}`
		);
		if (!response.ok) {
			throw new Error("Network response was not ok");
		}
		const rawData = await response.json();
		return rawData;
	} catch (error) {
		console.error("There was a problem fetching co-occurring effects:", error);
	}
};
