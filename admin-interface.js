

const getData = async (pwd, mode) => {
    const promise = await fetch(`https://parlonspc.fr/api/${mode}/`, {
        method: "POST",
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
    let nbValid = 0;
    let nbUnValid = 0;
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

        if (fiche.status) {
            nbValid++;
        } else {
            nbUnValid++;
        }

        if (fiche.type in nbByCat) {
            nbByCat[fiche.type]++;
        } else {
            nbByCat[fiche.type] = 1;
        }

        let rajout = 1;
        if (fiche.client in contact) {
            let key = fiche.client;
            if (contact[fiche.client]["tel"] !== fiche.fiche.tel || contact[fiche.client]["mail"] !== fiche.fiche.email) {
                while (key in contact) {
                    rajout++;
                    key = fiche.client + rajout;

                }

                contact[key] = { key, tel: fiche.fiche.tel, mail: fiche.fiche.email };
            }
        } else {
            contact[fiche.client] = { key, tel: fiche.fiche.tel, mail: fiche.fiche.email };
        }
    }
    return {
        lastFiche: lastTimeStr,
        lastClient,
        nbByCat,
        nbTotal,
        contact,
        nbValid,
        nbUnValid,
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
    document.getElementById("nb-valid-fiche").textContent += infos.nbValid;
    document.getElementById("nb-unvalid-fiche").textContent += infos.nbUnValid;
    return infos;
}



const addListener = (button, fiches) => {
    button.addEventListener("click", event => {
        const fiche = fiches[button.id].fiche;
        document.getElementById("fiche-container").innerHTML = null;
        document.getElementById("fiche-container").innerHTML = `<h2>${fiches[button.id]["client"].replace("-", " ")} le ${fiches[button.id]["date"]} à ${fiches[button.id]["heure"]}</h2> <br><br>`
        for (const key in fiche) {
            if (key !== "status") {
                document.getElementById("fiche-container").innerHTML += "<p>" + key + ": <br><span style='color:blue'>" + fiche[key] + "</span></p>";
            }

        }

        document.getElementById("fiche-container").style.display = "block";

        const backvoirButtonElement = document.createElement("button");
        backvoirButtonElement.textContent = "Retour";

        backvoirButtonElement.addEventListener("click", event => {
            location.reload();
        })
        document.getElementById("button-container").append(backvoirButtonElement)
    })
}

const sortFiches = (fiches) => {
    const sortingValue = localStorage.getItem("sorting")

    const arrayFiches = [];

    for (const fiche in fiches) {
        const ficheObject = fiches[fiche];
        ficheObject["id"] = fiche;
        arrayFiches.push(ficheObject)
    }



    switch (sortingValue) {
        case "name":
            document.getElementById("name-sort-button").style = "background-color: rgb(113 113 113)";
            return arrayFiches.sort((a, b) => a["fiche"]["family-name"].localeCompare(b["fiche"]["family-name"]));
        case "type":
            document.getElementById("type-sort-button").style = "background-color: rgb(113 113 113)";
            return arrayFiches.sort((a, b) => a["fiche"]["cette-personne-veut"].localeCompare(b["fiche"]["cette-personne-veut"]));
        case "sujet":
            document.getElementById("sujet-sort-button").style = "background-color: rgb(113 113 113)";
            return arrayFiches.sort((a, b) => a["fiche"]["en-rapport-avec"].localeCompare(b["fiche"]["en-rapport-avec"]));
        case "date":
            document.getElementById("date-sort-button").style = "background-color: rgb(113 113 113)";
            return arrayFiches.sort((a, b) => b["id"].localeCompare(a["id"]));

        default:
            localStorage.setItem("sorting", "date");
            location.reload()

    }


}

const fetchFiche = (fiches, cookies) => {

    document.getElementById("button-container").innerHTML = '<button id="contact-button">Voir tous les contact</button>';


    const sortedFiches = sortFiches(fiches);

    const searched = localStorage.getItem("searched");
    const searchedIN = localStorage.getItem("searchedIn");
    localStorage.removeItem("searched");
    localStorage.removeItem("searchedIn");
    for (const fiche of sortedFiches) {

        const searchConditions = (mode) => {
            if (mode === "simple") {
                if (fiche[searchedIN].toLowerCase().includes(searched.toLowerCase())) {
                    return true;
                }
            } else if (mode === "fiche") {
                if (fiche["fiche"][searchedIN].toLowerCase().includes(searched.toLowerCase())) {
                    return true;
                }
            } else {
                let result = false;
                Object.values(fiche).forEach(element => {
                    if (typeof element === "string") {
                        if (element.toLowerCase().includes(searched.toLowerCase())) {
                            result = true;
                        }
                    }

                })
                Object.values(fiche.fiche).forEach(element => {
                    if (typeof element === "string") {
                        if (element.toLowerCase().includes(searched.toLowerCase())) {
                            result = true
                        }
                    }
                })

                return result;

            }
        }


        switch (searchedIN) {
            case "client":
                if (searchConditions("simple")) {
                    break;
                }
                continue;
            case "societe":
                if (searchConditions("fiche")) {
                    break;
                }
                continue;
            case "email":
                if (searchConditions("fiche")) {
                    break;
                }
                continue;
            case "tel":
                if (searchConditions("fiche")) {
                    break;
                }
                continue;
            case "message":
                if (searchConditions("fiche")) {
                    break;
                }
                continue;
            case "all":
                if (searchConditions("all")) {
                    break;
                }
                continue;


            default:
                break;
        }



        const divElement = document.createElement("div");
        divElement.classList.add("fiche")
        if (fiche.status) {
            divElement.classList.add("valid");
        } else {
            divElement.classList.remove("valid");
        }

        const h2Element = document.createElement("h2");
        h2Element.textContent = fiche["fiche"]["given-name"] + " " + fiche["fiche"]["family-name"].toUpperCase();

        const pTypeElement = document.createElement("p");
        pTypeElement.textContent = fiche.type + " -- " + fiche.fiche["en-rapport-avec"];

        const pElement = document.createElement("p");
        pElement.textContent = fiche.date + " à " + fiche.heure;

        const changeFicheStatusButtonElement = document.createElement("button");
        if (fiche.status) {
            changeFicheStatusButtonElement.textContent = "unvalider";
        } else {
            changeFicheStatusButtonElement.textContent = "valider";
        }
        changeFicheStatusButtonElement.id = "valid-" + fiche["id"];



        const voirButtonElement = document.createElement("button");
        voirButtonElement.id = fiche["id"];
        voirButtonElement.textContent = "Voir";

        addListener(voirButtonElement, fiches);

        divElement.append(h2Element, pTypeElement, pElement, changeFicheStatusButtonElement, voirButtonElement);
        document.getElementById("fiche-container").append(divElement);

        changeFicheStatusButtonElement.addEventListener("click", async event => {
            await fetch("https://parlonspc.fr/api/set-fiche-status/", {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify(fiche["id"])
            })
            location.reload();
        })
    }
}

const onClickContactButton = (contact) => {
    document.getElementById("contact-button").addEventListener("click", event => {
        document.getElementById("button-container").innerHTML = null;
        document.getElementById("fiche-container").innerHTML = null;

        const keys = Object.keys(contact);
        const sortedKeys = keys.sort((a, b) => (a.split("-")[a.split("-").length - 1]).localeCompare(b.split("-")[b.split("-").length - 1]))
        document.getElementById("fiche-container").innerHTML = "<p>les contacts sont triés par nom de famille</p>"
        for (const key of sortedKeys) {
            const divElement = document.createElement("div");
            divElement.classList.add("fiche")

            const h2Element = document.createElement("h2");
            let keyWithoutTiret = key.replace("-", " ");
            while (keyWithoutTiret.includes("-")) {
                keyWithoutTiret = keyWithoutTiret.replace("-", " ");
            }
            h2Element.textContent = keyWithoutTiret;

            const pTypeElement = document.createElement("p");
            pTypeElement.textContent = contact[key]["tel"];

            const pElement = document.createElement("p");
            pElement.textContent = contact[key]["mail"];




            divElement.append(h2Element, pTypeElement, pElement);
            document.getElementById("fiche-container").append(divElement);
        }
        const backvoirButtonElement = document.createElement("button");
        backvoirButtonElement.textContent = "Retour";

        backvoirButtonElement.addEventListener("click", event => {
            location.reload();
        })
        document.getElementById("button-container").append(backvoirButtonElement);
    })
}


const extractData = (brutData) => {
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
        fiches = await getDataSession(cookies);
        document.getElementById("starting-modal").style.display = 'none';
        const infos = fetchInfos(fiches);
        fetchFiche(fiches);
        onClickContactButton(infos.contact);
    } else {
        brutData = await getData(pwd, "get-fiches");
        if (brutData != "bad") {

            const datas = extractData(brutData);

            fiches = datas["fiches"];
            cookies = datas["cookies"];

            setCookies(cookies);

            document.getElementById("starting-modal").style.display = 'none';
            const infos = fetchInfos(fiches);
            fetchFiche(fiches, cookies);
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


document.getElementById("name-sort-button").addEventListener("click", event => {
    localStorage.setItem("sorting", "name");
    location.reload()
})

document.getElementById("type-sort-button").addEventListener("click", event => {
    localStorage.setItem("sorting", "type");
    location.reload()
})

document.getElementById("sujet-sort-button").addEventListener("click", event => {
    localStorage.setItem("sorting", "sujet");
    location.reload()
})

document.getElementById("date-sort-button").addEventListener("click", event => {
    localStorage.setItem("sorting", "date");
    location.reload()
})

document.getElementById("search-button").addEventListener("click", event => {
    localStorage.setItem("searched", document.getElementById("input-searched-word").value);
    localStorage.setItem("searchedIn", document.getElementById("select-searched-in").value);
    location.reload()
})