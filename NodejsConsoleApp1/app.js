//install npm promt-sync
const prompt = require('prompt-sync')();

console.log('#######################################################################################');
console.log('#######       #########      #########         ##########      ##########      ########');
console.log('#######       ##      ##     ##      ##       ##               ##       ##     ########');
console.log('#######       ##      ##     ##       ##     ##                ##        ##    ########');
console.log('#######       ##     ##      ##      ##       ##               ##       ##     ########');
console.log('#######       #######        ########           ########       #########       ########');
console.log('#######       ##  ##         ##                        ##      ##      ##      ########');
console.log('#######       ##   ##        ##                         ##     ##       ##     ########');
console.log('#######       ##    ##       ##                        ##      ##      ##      ########');
console.log('#######       ##     ##      ##                #########       #########       ########');
console.log('#######################################################################################');
console.log('RePayment Schedule Builder v1.0 by Goerkem Demirkol');
console.log('This program is designed to prepare repayment schedules for loans with regular payments');
console.log('#######################################################################################');

do {
    console.log('\n\n\nPlease enter loan amount (i.e. 2000000)');
    let loanAmount = Number(prompt('loan amount:'));

    console.log('\n\n\nPlease enter interest rate (i.e. 2 for %2)');
    let interestRate = Number(prompt('interest rate:'));

    console.log('\n\n\nPlease enter one of the following payment frequency code: (i.e Q)' +
        '\n M:Monthly' +
        '\n Q:Quarterly' +
        '\n H:Semianually' +
        '\n J:yearly ');
    let paymentFrequency = prompt('payment frequency:');

    console.log('\n\n\nPlease enter utilization date for the loan with the format yyyy-mm-dd (i.e. 2020-12-31)');
    let utilizationDate = prompt('utilization date:');
    while (!isValidDate(utilizationDate)) {
        console.log('utilization date entered is not valid!');
        utilizationDate = prompt('utilization date:');
    } 
    

    console.log('\n\n\nEnter if there is grace period, otherwise could be left empty.');
    console.log('Please enter the date of the first installment with the format yyyy-mm-dd (i.e. 2020-12-31)');
    let paymentStartDate = prompt('the date of first installment:');
    if (paymentStartDate != '') {
        while (!isValidPaymentStartDate(paymentStartDate, utilizationDate)) {
            console.log('the date of first installment entered is not valid!');
            paymentStartDate = prompt('the date of first installment:');
        }
    } else {
        console.log('Payment start date has not been entered. Therefore first installment will be on utilization date.');
        paymentStartDate = utilizationDate;
    }

    console.log('\n\n\nPlease enter maturity date for the loan with the format yyyy-mm-dd (i.e. 2020-12-31)');
    let maturity = prompt('maturity date:');
    while (!isValidMaturityDate(maturity, utilizationDate, paymentStartDate)) {
        console.log('Maturity date entered is not valid!');
        maturity = prompt('maturity date:');
    }

    var paymentSchedule = execute(loanAmount, interestRate, paymentFrequency, utilizationDate, maturity, paymentStartDate);

    console.log('\n\n\nWould you like to print the result in CSV format? (Y/N)');
    let exportText = prompt('print csv:');

    if (exportText.toUpperCase() == 'Y') {
        printCsvFormat(paymentSchedule);
    }

    console.log('Would you like to recalculate with new parameters? (Y/N)');
   
} while (prompt('recalculate:') == 'Y')

function isValidPaymentStartDate(paymentStart, utilization) {
    if (isValidDate(paymentStart)) {
        let paymentStart = new Date(paymentStart);
        let utilization = new Date(utilization);
        if (paymentStart > utilization) {
            return false;
            console.log('Payment start date can not be earlier than utilization date!')
        } else {
            return true;
        }
    }
    return false;
}

function isValidMaturityDate(maturity, utilization, paymentStart) {
    if (isValidDate(maturity)) {
        var maturity = new Date(maturity);
        var paymentStart = new Date(paymentStart);
        var utilization = new Date(utilization);
        if ((maturity < utilization) || (maturity < paymentStart)) {
            return false;
            console.log('Maturity date can not be earlier than utilization date or payment start date!')
        } else {
            return true;
        }
    }
    return false;
}

function isValidDate(dateString) {
    var regEx = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateString.match(regEx)) {
        console.log('Invalid date format!')
        return false;
    }
    var d = new Date(dateString);
    var dNum = d.getTime();
    if (!dNum && dNum !== 0) {
        console.log('Invalid date format!')
        return false;
    }
    if (d.toISOString().slice(0, 10) === dateString) {
        return true;
    } else {
        console.log('Invalid date format!')
        return false;
    }
}

function execute(loanAmount, interestRate, frequency, utilizationDate, maturityDate, paymentStart) {
    var frequency = frequency.toUpperCase();
    var maturityDate = new Date(maturityDate);
    var utilizationDate = new Date(utilizationDate);
    var paymentStart = new Date(paymentStart);
    var durationDays = getDifferenceInDays(maturityDate, paymentStart);
    var nInstallments = Math.ceil(durationDays/getPeriodicityDays(frequency));
    var installmentAmount = loanAmount / nInstallments;
    var remainingPrincipal = loanAmount;
    var payments = [];
    var interestAmount = 0.00;
    var previousPaymentDate = new Date(utilizationDate);
    var paymentDate = new Date();
    if (paymentStart == utilizationDate) {
        paymentDate = getNextPaymentDate(paymentStart, frequency);
    } else {
        paymentDate = paymentStart;
    }

    for (let i = 0; i < nInstallments; i++) {
        interestAmount = remainingPrincipal * getDifferenceInDays(paymentDate, previousPaymentDate) / 360 * interestRate / 100
        payments.push(new Payment(i, installmentAmount, remainingPrincipal, interestRate, interestAmount, previousPaymentDate, paymentDate));
        remainingPrincipal = remainingPrincipal - installmentAmount;
        previousPaymentDate = paymentDate;
        paymentDate = getNextPaymentDate(paymentDate, frequency);
    }


    for (let i = 0; i < payments.length; i++) {
        console.log(
            "\npaymentNumber[" + payments[i].id + "]:\n{" +
            "\n previous payment date: " + convertDateToString(payments[i].previousPaymentDate) +
            "\n payment date: " + convertDateToString(payments[i].paymentDate) +
            "\n principalPayment: " + Math.round(payments[i].principalPayment) +
            "\n accumulating days: " +
            getDifferenceInDays(payments[i].paymentDate, payments[i].previousPaymentDate) +
            "\n remainingPrincipal: " + Math.round(payments[i].remainingPrincipal) +
            "\n interestAmount: " + Math.round(payments[i].interestAmount) + "\n}");
    }

    return payments;
}

function Payment(id, principalPayment, remainingPrincipal, interestRate, interestAmount, previousPaymentDate, paymentDate) {
    this.id = id;
    this.principalPayment = principalPayment;
    this.remainingPrincipal = remainingPrincipal;
    this.interestRate = interestRate;
    this.interestAmount = interestAmount;
    this.previousPaymentDate = previousPaymentDate;
    this.paymentDate = paymentDate;
}

function getDifferenceInDays(thisDate, minusThisDate) {
    var durationTime = thisDate.getTime() - minusThisDate.getTime();
    return Math.round(durationTime / (1000 * 3600 * 24));
}

function getNextPaymentDate(previousPaymentDate, paymentFrequency) {

    if (paymentFrequency == 'M') {
        return addMonths(previousPaymentDate, 1);
    } else if (paymentFrequency == 'Q') {
        return addMonths(previousPaymentDate, 3);
    } else if (paymentFrequency == 'H') {
        return addMonths(previousPaymentDate, 6);
    } else if (paymentFrequency == 'J') {
        return addMonths(previousPaymentDate, 12);
    }
    throw 'ERROR: unknown periodicity'
}

function getPeriodicityDays(paymentFrequency) {

    if (paymentFrequency == 'M') {
        return 31;
    } else if (paymentFrequency == 'Q') {
        return 92;
    } else if (paymentFrequency == 'H') {
        return 164;
    } else if (paymentFrequency == 'J') {
        return 365;
    }
    throw 'ERROR: unknown periodicity'
}

function getEOM(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date, nMonths) {
    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDay();

    for (var i = 0; i < nMonths; i++) {
        if (month == 12) {
            year++;
            month = 1
        } else {
            month++;
        }
    }
    return getEOM(new Date(year, month, 1));
}

function convertDateToString(date) {
    var dd = String(date.getDate()).padStart(2, '0');
    var mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = date.getFullYear();
    return dd + '.' + mm + '.' + yyyy;
}

function printCsvFormat(payments) {
    console.log('id,previous_payment_date,payment_date,days,remaining_principal,principal_payment,interest_rate,interest_amount')
    for (let i = 0; i < payments.length; i++) {
        console.log(
            payments[i].id + ',' +
            convertDateToString(payments[i].previousPaymentDate) + ',' +
            convertDateToString(payments[i].paymentDate) + ',' +
            getDifferenceInDays(payments[i].paymentDate, payments[i].previousPaymentDate) + ',' +
            Math.round(payments[i].remainingPrincipal) + ',' +
            Math.round(payments[i].principalPayment) + ',' +
            Math.round(payments[i].interestRate) + ',' +
            Math.round(payments[i].interestAmount) );
    }


}
