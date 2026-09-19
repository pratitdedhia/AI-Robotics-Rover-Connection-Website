let port = null;
let reader = null;
let writer = null;

let buffer = "";


const connectBtn =
    document.getElementById("connectBtn");

const dot =
    document.getElementById("dot");

const connectionText =
    document.getElementById("connectionText");

const gas =
    document.getElementById("gas");

const flame =
    document.getElementById("flame");

const pump =
    document.getElementById("pump");

const state =
    document.getElementById("state");

const gasBar =
    document.getElementById("gasBar");

const logBox =
    document.getElementById("log");

const autoBtn =
    document.getElementById("autoBtn");

const manualBtn =
    document.getElementById("manualBtn");

const modeText =
    document.getElementById("modeText");


// =====================================================
// LOG
// =====================================================

function log(message) {

    const time =
        new Date()
            .toLocaleTimeString();

    logBox.innerHTML +=
        `[${time}] ${message}<br>`;

    logBox.scrollTop =
        logBox.scrollHeight;
}


// =====================================================
// CONNECTION
// =====================================================

function setConnection(status) {

    if (status) {

        dot.className =
            "online";

        connectionText.textContent =
            "Bluetooth Connected";

        connectBtn.textContent =
            "CONNECTED";

    } else {

        dot.className =
            "offline";

        connectionText.textContent =
            "Disconnected";

        connectBtn.textContent =
            "CONNECT BLUETOOTH";
    }
}


// =====================================================
// CONNECT
// =====================================================

connectBtn.onclick =
    async function () {

        try {

            if (!("serial" in navigator)) {

                alert(
                    "Use Google Chrome or Microsoft Edge."
                );

                return;
            }


            port =
                await navigator
                    .serial
                    .requestPort();


            await port.open({
                baudRate: 9600
            });


            writer =
                port
                    .writable
                    .getWriter();


            setConnection(true);

            log(
                "Bluetooth connected."
            );


            readData();

        }

        catch(error) {

            console.error(error);

            log(
                "Connection failed: "
                + error.message
            );

        }

    };


// =====================================================
// READ DATA
// =====================================================

async function readData() {

    const decoder =
        new TextDecoderStream();


    port.readable.pipeTo(
        decoder.writable
    );


    reader =
        decoder
            .readable
            .getReader();


    try {

        while(true) {

            const {
                value,
                done
            } = await reader.read();


            if(done)
                break;


            if(value) {

                buffer += value;


                const lines =
                    buffer.split("\n");


                buffer =
                    lines.pop();


                for(
                    let line of lines
                ) {

                    line =
                        line.trim();


                    if(line) {

                        processData(line);
                    }
                }
            }
        }

    }

    catch(error) {

        log(
            "Bluetooth disconnected."
        );

        setConnection(false);
    }
}


// =====================================================
// SEND
// =====================================================

async function sendCommand(command) {

    if(!writer) {

        log(
            "Bluetooth not connected."
        );

        return;
    }


    try {

        await writer.write(
            new TextEncoder()
                .encode(
                    command + "\n"
                )
        );


        log(
            "TX: " + command
        );

    }

    catch(error) {

        log(
            "Send error."
        );
    }
}


// =====================================================
// PROCESS TELEMETRY
// =====================================================

function processData(line) {

    console.log(
        "RX:",
        line
    );


    if(
        line.startsWith("DATA,")
    ) {

        const parts =
            line.split(",");


        const gasValue =
            parseInt(parts[1]);


        const flameValue =
            parseInt(parts[2]);


        const stateValue =
            parts[3];


        const pumpValue =
            parseInt(parts[4]);


        // GAS

        gas.textContent =
            gasValue;


        let percentage =
            (gasValue / 1023) * 100;


        percentage =
            Math.min(
                100,
                percentage
            );


        gasBar.style.width =
            percentage + "%";


        // FLAME

        flame.textContent =
            flameValue === 1
                ? "DETECTED"
                : "NO FLAME";


        // PUMP

        pump.textContent =
            pumpValue === 1
                ? "ON"
                : "OFF";


        // STATE

        state.textContent =
            stateValue
                .replaceAll(
                    "_",
                    " "
                );

    }


    else {

        log(
            "RX: " + line
        );
    }
}


// =====================================================
// AUTO
// =====================================================

autoBtn.onclick =
    async function () {

        await sendCommand(
            "MODE AUTO"
        );


        autoBtn.classList.add(
            "active"
        );

        manualBtn.classList.remove(
            "active"
        );


        modeText.textContent =
            "Automatic operation enabled.";
    };


// =====================================================
// MANUAL
// =====================================================

manualBtn.onclick =
    async function () {

        await sendCommand(
            "MODE MANUAL"
        );


        manualBtn.classList.add(
            "active"
        );

        autoBtn.classList.remove(
            "active"
        );


        modeText.textContent =
            "Manual rover control enabled.";
    };


// =====================================================
// MOVEMENT
// =====================================================

document
    .querySelectorAll(
        "[data-command]"
    )
    .forEach(button => {

        button.onclick =
            function () {

                sendCommand(
                    button.dataset.command
                );
            };

    });


// =====================================================
// PUMP
// =====================================================

document.getElementById(
    "pumpOn"
).onclick = function () {

    sendCommand(
        "PUMP ON"
    );

};


document.getElementById(
    "pumpOff"
).onclick = function () {

    sendCommand(
        "PUMP OFF"
    );

};


// =====================================================
// KEYBOARD
// =====================================================

document.onkeydown =
    function(event) {

        switch(
            event.key.toLowerCase()
        ) {

            case "w":
                sendCommand(
                    "FORWARD"
                );
                break;

            case "a":
                sendCommand(
                    "LEFT"
                );
                break;

            case "s":
                sendCommand(
                    "BACKWARD"
                );
                break;

            case "d":
                sendCommand(
                    "RIGHT"
                );
                break;

            case " ":
                sendCommand(
                    "STOP"
                );
                break;
        }

    };