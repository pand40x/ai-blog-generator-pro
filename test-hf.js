async function query(data) {
    const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
            headers: {
                "Content-Type": "application/json",
                // Token yok
            },
            method: "POST",
            body: JSON.stringify(data),
        }
    );

    console.log("Status:", response.status);
    if (!response.ok) {
        console.log("Error:", await response.text());
        return;
    }

    const result = await response.blob();
    console.log("Blob size:", result.size);
    console.log("Success! Image generated.");
}

query({ "inputs": "Astronaut riding a horse" }).then(() => console.log("Done"));
