$(function(){

    /* Used for keeping track of how many "pages" of content has been loaded with AJAX
     Used in .skip() function at backend when using the "load more" button */
    var page = 0;

    //Used to determine where to GET ajax-search results
    var drinkType = $("#pageTitle").data("get-url");
    //Hides the "Load more" button if #buttonHide span is rendered on the page
    function loadMoreButton() {
        if($("#buttonHide").data("hide") === true) {
            $("#loadMoreButton").hide();
        } else {
            $("#loadMoreButton").show();
        }
    }

    //Get search params from the page
    function getSearchParam() {
        var search      = $("#searchInput").val(),
            sort        = $("#sortBy").val(),
            asc         = $("#ascDesc").val();
        return {search: search, sort: sort, asc: asc, page: page};
    }

    //Used to update the search results when search parameters change
    function updateAll() {
        $.get("/juomat/" + drinkType, getSearchParam()).done(function (r) {
            $("#ajaxReplace").html(r);
            loadMoreButton();
        });
    }

    //Send an GET request every time data is modified in #searchInput
    $("#searchInput").keyup(function() {
        //resets the page number so the next time the "Load more" button is pressed, it wont .skip() too much content
        page = 0;
       updateAll();
    });

    //Send an GET request every time data is modified in #searchInput
    $("#sortBy").change(function() {

        //resets the page number so the next time the "Load more" button is pressed, it wont .skip() too much content
        page = 0;
        updateAll();

    });

    $("#ascDesc").change(function() {
        updateAll();
        //resets the page number so the next time the "Load more" button is pressed, it wont .skip() too much content
        /* page = 1;*/
    });

    //Sends a get request to load more data, skipping the already shown campgrounds using the page variable
    $("#loadMoreButton").click(function() {
        page++;
        $.get("/juomat/" + drinkType, getSearchParam()).done(function(r) {
            $("#ajaxReplace").append(r);
            loadMoreButton();
        });
    });

    updateAll();

    // $.get("/juomat/" + pageTitle, getSearchParam()).done(function (r) {
    //
    //     $("#ajaxReplace").html(r);
    //     loadMoreButton();
    // });

});
