import moment from "moment-timezone";

function getCurrentDateInBrazil() {
    return moment.tz("America/Sao_Paulo").toDate();
}

export default getCurrentDateInBrazil;