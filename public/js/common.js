function ensureOneCheck(checkBoxName, messageId, submitId) {
    const checkBoxes = $('[name=' + checkBoxName + ']');
    let checkCount = 0;
    for (let i = 0; i < checkBoxes.length; i++) {
        if (checkBoxes[i].checked)
            checkCount++;
    }
    if (checkCount === 0) {
        $('#' + messageId).show();
        $('#' + submitId).prop('disabled', true);
        return false;
    } else {
        $('#' + messageId).hide();
        $('#' + submitId).prop('disabled', false);
        return true;
    }
}

// Display selected file name
$(".custom-file-input").on("change", function () {
    var fileName = $(this).val().split("\\").pop();
    $(this).siblings(".custom-file-label").addClass("selected").html(fileName);
});


// Use fetch to call post route /video/upload
$('#imgUpload').on('change', function () {
    let formdata = new FormData();
    let image = $("#imgUpload")[0].files[0];
    formdata.append('imgUpload', image);
    fetch('/user/upload', {
        method: 'POST',
        body: formdata
    })
        .then(res => res.json())
        .then((data) => {
            $('#img').attr('src', data.file);
            $('#imgURL').attr('value', data.file); // sets posterURL hidden field
            if (data.err) {
                $('#imgErr').show();
                $('#imgErr').text(data.err.message);
            }
            else {
                $('#imgErr').hide();
            }
        })
});
