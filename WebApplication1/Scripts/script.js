window.onload = function () {
    function test1() {
        $.ajax({
            async: true,
            method: "post",
            url: '/home/GetSmth',
            data: { Id: 7298},
            //data: { Id: 46},
            success: function (data) {
                //$('#for-result').attr("src""<iframe width='100%' height='400' class='frame' src='" + 'Content/TMP/test4.pdf' + "'> </iframe>"); 
                console.log(data);
                $('#for-qwestion').attr("src", "data:image/png;base64, " + data[0]);
                $('#for-answer1').attr("src", "data:image/png;base64, " + data[1]);
                $('#for-answer2').attr("src", "data:image/png;base64, " + data[2]);
                $('#for-answer3').attr("src", "data:image/png;base64, " + data[3]);
                $('#for-answer4').attr("src", "data:image/png;base64, " + data[4]);
                
            }
        });
    }
    function test2() {
        $.ajax({
            async: true,
            method: "post",
            url: '/home/GetSmth1',
            data: { Id: 13454 },
            success: function (data) {
                //$('#for-result').attr("src", "<iframe width='100%' height='400' class='frame' src='" + data[0] + "'> </iframe>"); 
                console.log(typeof data);
                //data.forEach((item) => save(item));
                
            }
        });
    }
    function save(response) {
        var blob = response;
        var a = window.document.createElement('a');
        var binaryData = [];
        binaryData.push(blob);
        a.href = window.URL.createObjectURL(new Blob(binaryData, { type: "application/pdf" }));
       // a.href = window.URL.createObjectURL(blob);
        a.download = "tst.doc";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    test1();
    //test2();
};