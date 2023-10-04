

const getData = async (pwd, mode) => {
    const promise = await fetch(`http://164.132.229.216:6601/${mode}/`, {
        method: "POST",
        // mode: "no-cors"
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify(pwd)
    })
    return await promise.json();
}

const getTimeStamp = (date, heure) => {
    const newDate = date.split("-")[2] + "-" + date.split("-")[1] + "-" + date.split("-")[0];
    const newHeure = heure.replace("h", ":")
    const formatedDateTime = newDate + "T" + newHeure;
    const time = new Date(formatedDateTime).getTime();
    return time;
}

const parseFiches = (fiches) => {
    let lastClient;
    let lastTimeStr;
    let lastTime = 0;

    let nbTotal = 0;
    let nbByCat = {};

    let contact = {};

    for (const key in fiches) {
        nbTotal++;
        const fiche = fiches[key]
        const time = key
        if (time > lastTime) {
            lastTime = time;
            lastTimeStr = `le ${fiche.date} à ${fiche.heure}`
            lastClient = fiche.client.replace("-", " ");
        }

        if (fiche.type in nbByCat) {
            nbByCat[fiche.type]++;
        } else {
            nbByCat[fiche.type] = 1;
        }

        let rajout = 1;
        if (fiche.client in contact) {
            let key = fiche.client;
            if (contact[fiche.client][0] !== fiche.fiche.tel || contact[fiche.client][1] !== fiche.fiche.email) {
                while (key in contact) {
                    rajout++;
                    key = fiche.client + rajout;

                }

                contact[key] = [fiche.fiche.tel, fiche.fiche.email];
            }
        } else {
            contact[fiche.client] = [fiche.fiche.tel, fiche.fiche.email];
        }
    }
    return {
        lastFiche: lastTimeStr,
        lastClient,
        nbByCat,
        nbTotal,
        contact,
    }
}

const fetchInfos = (data) => {
    const infos = parseFiches(data);
    for (const el in infos.nbByCat) {
        const pElement = document.createElement("p");
        pElement.textContent = `${infos.nbByCat[el]} ${el}`;
        document.getElementById("nombre-par-categorie").append(pElement);
    }
    document.getElementById("nb-total").textContent += infos.nbTotal;
    document.getElementById("derniere-fiche").textContent += infos.lastFiche;
    document.getElementById("dernier-client").textContent += infos.lastClient;
    return infos;
}



const addListener = (button, fiches) => {
    button.addEventListener("click", event => {
        const fiche = fiches[button.id].fiche;
        document.getElementById("fiche-container").innerHTML = null;
        document.getElementById("fiche-container").innerHTML = `<h2>${fiches[button.id]["client"]} le ${fiches[button.id]["date"]} à ${fiches[button.id]["heure"]}</h2> <br><br>`
        for (const key in fiche) {
            document.getElementById("fiche-container").innerHTML += "<p>" + key + ": <br><span style='color:blue'>" + fiche[key] + "</span></p>";
        }

        document.getElementById("fiche-container").style.display = "block";

        const backButtonElement = document.createElement("button");
        backButtonElement.textContent = "Retour";

        backButtonElement.addEventListener("click", event => {
            location.href = "/admin-interface.html";
        })
        document.querySelector("body").append(backButtonElement)
    })
}

const fetchFiche = (fiches) => {
    // document.getElementById("fiche-container").innerHTML = null;

    document.getElementById("button-container").innerHTML = '<button id="contact-button">Voir tous les contact</button>';

    const keys = Object.keys(fiches).sort((a, b) => parseInt(b) - parseInt(a));

    for (const key of keys) {

        const divElement = document.createElement("div");
        divElement.classList.add("fiche")

        const h2Element = document.createElement("h2");
        h2Element.textContent = fiches[key]["client"].replace("-", " ");

        const pTypeElement = document.createElement("p");
        pTypeElement.textContent = fiches[key].type + " -- " + fiches[key].fiche["en-rapport-avec"];

        const pElement = document.createElement("p");
        pElement.textContent = fiches[key].date + " à " + fiches[key].heure;

        const buttonElement = document.createElement("button");
        buttonElement.id = key;
        buttonElement.textContent = "Voir";

        addListener(buttonElement, fiches);

        divElement.append(h2Element, pTypeElement, pElement, buttonElement);
        document.getElementById("fiche-container").append(divElement);
    }
}

const onClickContactButton = (contact) => {
    document.getElementById("contact-button").addEventListener("click", event => {
        document.getElementById("button-container").innerHTML = null;
        document.getElementById("fiche-container").innerHTML = null;

        for (const key in contact) {

            const divElement = document.createElement("div");
            divElement.classList.add("fiche")

            const h2Element = document.createElement("h2");
            h2Element.textContent = key.replace("-", " ");

            const pTypeElement = document.createElement("p");
            pTypeElement.textContent = contact[key][0];

            const pElement = document.createElement("p");
            pElement.textContent = contact[key][1];




            divElement.append(h2Element, pTypeElement, pElement);
            document.getElementById("fiche-container").append(divElement);
        }
        const backButtonElement = document.createElement("button");
        backButtonElement.textContent = "Retour";

        backButtonElement.addEventListener("click", event => {
            location.href = "/admin-interface.html";
        })
        document.querySelector("body").append(backButtonElement);
    })
}


const extractCookies = (brutData) => {
    const data = JSON.parse(brutData)
    let fiches = {};
    let cookies = {};
    for (const key in data) {
        if (key === "cookies") {
            cookies["session"] = data[key]["session"];
            cookies["signature"] = data[key]["signature"];
        } else {
            fiches[key] = data[key];
        }
    }
    return { fiches, cookies };
}

const setCookies = (cookies) => {
    let expiryDate = new Date();
    expiryDate.setTime(expiryDate.getTime() + (1 * 60 * 60 * 1000));

    document.cookie = `session=${cookies["session"]};expires=${expiryDate.toUTCString()};path=/`;
    document.cookie = `signature=${cookies["signature"]};expires=${expiryDate.toUTCString()};path=/`;
}

const onPromiseFulfilled = async (pwd) => {
    let fiches;
    let brutData;
    let cookies = document.cookie;
    if (cookies) {
        console.log("cookies", cookies);
        fiches = await getDataSession(cookies);
        document.getElementById("starting-modal").style.display = 'none';
        console.log("fiches", fiches);
        const infos = fetchInfos(fiches);
        fetchFiche(fiches);
        onClickContactButton(infos.contact);
    } else {
        brutData = await getData(pwd, "get-fiches");
        if (brutData != "bad") {

            const datas = extractCookies(brutData);

            fiches = datas["fiches"];
            cookies = datas["cookies"];

            setCookies(cookies);

            document.getElementById("starting-modal").style.display = 'none';
            const infos = fetchInfos(fiches);
            fetchFiche(fiches);
            onClickContactButton(infos.contact);

        } else {
            document.getElementById("wrong-pass-container").innerHTML = null;
            const pElement = document.createElement("p");
            pElement.textContent = "Mauvais mot de passe."
            pElement.style = "color:red";
            pElement.id = "wrong-pass";
            document.getElementById("wrong-pass-container").append(pElement);
        }
    }



}

const getDataSession = async (cookies) => {
    const fiches = JSON.parse(await getData(cookies, "getsession-fiches"));
    return fiches
}


// onPromiseFulfilled();
document.getElementById("submit-button").addEventListener("click", async event => {

    const pwd = document.getElementById("pwd").value;
    onPromiseFulfilled(pwd);
})


try {
    const start = document.cookie;
    if (start.includes("session=")) {

        onPromiseFulfilled(pwd);
    }
} catch { }
