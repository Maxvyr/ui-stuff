let invoice = {
  // PROPERTIES
  hNum: null, // html invoice number
  hDate: null, // html invoice date
  hBill: null, // html bill to
  hItems: null, // html items list
  hAdd: null, // html add item row
  hData: null, // html items datalist
  hTotal: null, // html total amount
  hLoad: null, // html load invoice

  //INIT ITEMS LIST
  init: () => {
    //GET HTML ELEMENTS
    invoice.hNum = document.getElementById("inNum");
    invoice.hDate = document.getElementById("inDate");
    invoice.hBill = document.getElementById("inBill");
    invoice.hItems = document.getElementById("itemsList");
    invoice.hAdd = document.getElementById("itemsAdd");
    invoice.hData = document.getElementById("itemsData");
    invoice.hTotal = document.getElementById("totals");
    invoice.hLoad = document.querySelector("#loader input[type=file]");

    //POPULATE ITEMS DATALIST
    for (let i of Object.keys(items)) {
      let row = document.createElement("option");
      row.value = i;
      invoice.hData.appendChild(row);
    }
  },

  //SET PRICE EACH (WHEN CHOOSING ITEM)
  price: (item) => {
    if (items[item.value]) {
      item.nextElementSibling.value = items[item.value];
    }
  },

  //ADD ITEM
  add: (calc) => {
    // (D1) CLONE NEW ITEM ROW
    let row = invoice.hAdd.cloneNode(true),
      qty = row.querySelector(".qty"),
      item = row.querySelector(".item"),
      price = row.querySelector(".price"),
      act = row.querySelector(".action");
    row.removeAttribute("id");
    qty.required = true;
    qty.setAttribute("onchange", "invoice.total()");
    item.required = true;
    price.required = true;
    price.setAttribute("onchange", "invoice.total()");
    act.value = "X";
    act.setAttribute("onclick", "invoice.remove(this.parentElement)");
    document.getElementById("itemsList").appendChild(row);

    //RESET ADD ITEM
    for (let i of invoice.hAdd.querySelectorAll("input:not(.action)")) {
      i.value = "";
    }

    //CALCULATE TOTAL
    if (calc) {
      invoice.total();
    }
  },

  //REMOVE ITEM
  remove: (row) => {
    row.remove();
    invoice.total();
  },

  //CALCULATE TOTAL
  total: () => {
    let total = 0;
    for (let row of invoice.hItems.querySelectorAll(".irow")) {
      let qty = parseInt(row.querySelector(".qty").value),
        price = parseFloat(row.querySelector(".price").value);
      if (isNaN(qty) || isNaN(price)) {
        continue;
      }
      total += qty * price;
    }
    invoice.hTotal.innerHTML = "Grand Total: $" + total.toFixed(2);
  },

  //SAVE INVOICE
  save: () => {
    //GET INVOICE DATA
    let data = {};
    data.num = invoice.hNum.value;
    data.date = invoice.hDate.value;
    data.bill = invoice.hBill.value;
    data.items = [];
    for (let row of invoice.hItems.querySelectorAll(".irow")) {
      let item = [];
      for (let i of row.querySelectorAll("input:not(.action)")) {
        item.push(i.value);
      }
      data.items.push(item);
    }

    //CONSTRUCT BLOB & "FORCE DOWNLOAD"
    let url = window.URL.createObjectURL(
      new Blob([JSON.stringify(data)], { type: "application/json" })
    );
    let a = document.createElement("a");
    a.href = url;
    a.download = "invoice.json";
    a.click();
    window.URL.revokeObjectURL(url);
  },

  //LOAD INVOICE
  load: () => {
    //FILE READER
    const reader = new FileReader();

    //DRAW INVOICE
    reader.onload = (e) => {
      invoice.hLoad.value = "";
      try {
        let data = JSON.parse(reader.result);
        invoice.hNum.value = data.num;
        invoice.hDate.value = data.date;
        invoice.hBill.value = data.bill;
        invoice.hItems.innerHTML = "";
        for (let row of data.items) {
          invoice.hAdd.querySelector(".qty").value = row[0];
          invoice.hAdd.querySelector(".item").value = row[1];
          invoice.hAdd.querySelector(".price").value = row[2];
          invoice.add();
        }
        invoice.total();
      } catch (e) {
        alert("Error loading file");
        console.error(e);
      }
    };

    //ERROR READING
    reader.onerror = (e) => {
      alert("Error loading file");
      console.error(e);
    };

    //LOAD FILE
    reader.readAsText(invoice.hLoad.files[0]);
  },

  //PRINT INVOICE
  print: () => {
    //CHECK FOR ITEMS
    if (invoice.hItems.querySelectorAll(".irow").length == 0) {
      alert("Please add at least one item.");
      return false;
    }

    //OPEN PRINT PAGE
    let page = window.open("print.html");
    page.onload = () => {
      //INVOICE
      page.document.getElementById("billto").innerHTML =
        "<strong>BILL TO:</strong><br>" +
        invoice.hBill.value.replace(/\n/g, "<br>");
      page.document.getElementById("inNum").innerHTML =
        "<strong>INVOICE #: </strong>" + invoice.hNum.value;
      page.document.getElementById("inDate").innerHTML =
        "<strong>DATE: </strong>" + invoice.hDate.value;

      //ITEMS
      for (let row of invoice.hItems.querySelectorAll(".irow")) {
        let clone = row.cloneNode(true);
        clone.querySelector(".action").remove();
        for (let i of clone.querySelectorAll("input")) {
          i.readOnly = true;
        }
        page.document.getElementById("items").appendChild(clone);
      }

      //TOTALS
      page.document.getElementById("totals").innerHTML =
        invoice.hTotal.innerHTML;

      //PRINT INVOICE
      page.print();
    };
    return false;
  },
};

window.addEventListener("load", invoice.init);
