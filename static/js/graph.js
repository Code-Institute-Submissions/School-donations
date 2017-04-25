queue()
   .defer(d3.json, "/donorsUS/projects")
   .await(makeGraphs);

function makeGraphs(error, projectsJson) {

   //Clean projectsJson data
   var donorsUSProjects = projectsJson;
   //var dateFormat = d3.time.format("%Y-%m-%d %H:%M");
    var dateFormat = d3.time.format("%d-%m-%Y %H:%M");
   donorsUSProjects.forEach(function (d) {
        console.log(d['date_posted']);
       d["date_posted"] = dateFormat.parse(d["date_posted"]);

       d["date_posted"].setDate(1);
       d["total_donations"] = +d["total_donations"];
   });


   //Create a Crossfilter instance
   var ndx = crossfilter(donorsUSProjects);

   //Define Dimensions
   var gradeLevelDim = ndx.dimension(function (d) {return d["grade_level"];});
   var dateDim = ndx.dimension(function (d) {return d["date_posted"];});
   var resourceTypeDim = ndx.dimension(function (d) {return d["resource_type"];});
   var povertyLevelDim = ndx.dimension(function (d) {return d["poverty_level"];});
   var stateDim = ndx.dimension(function (d) {return d["school_state"];});
   var totalDonationsDim = ndx.dimension(function (d) {return d["total_donations"];});
   var fundingStatus = ndx.dimension(function (d) {return d["funding_status"];});
   var studentsDim = ndx.dimension(function (d) { return d["students_reached"]; });
   var donorsNumDim = ndx.dimension(function (d) { return d["num_donors"]; });


   //Calculate metrics
   var numProjectsByGrade = gradeLevelDim.group();
   var numProjectsByDate = dateDim.group();
   var numProjectsByResourceType = resourceTypeDim.group();
   var numProjectsByPovertyLevel = povertyLevelDim.group();
   var numProjectsByFundingStatus = fundingStatus.group();
   var numProjectsByStudents = studentsDim.group();
    var numProjectsByDonors = donorsNumDim.group();


   var totalDonationsByState = stateDim.group().reduceSum(function (d) {return d["total_donations"];});
   var stateGroup = stateDim.group();


   var all = ndx.groupAll();
   var totalDonations = ndx.groupAll().reduceSum(function (d) {return d["total_donations"];});
   var totalStudents = ndx.groupAll().reduceSum(function (d) { return d["students_reached"]; });
    var totalDonors = ndx.groupAll().reduceSum(function (d) { return d["num_donors"]; });
   var max_state = totalDonationsByState.top(1)[0].value;

   //Define values (to be used in charts)
   var minDate = dateDim.bottom(1)[0]["date_posted"];
   var maxDate = dateDim.top(1)[0]["date_posted"];

   var minStudents = studentsDim.bottom(1)[0]["students_reached"];
   var maxStudents = studentsDim.top(1)[0]["students_reached"];
    var minDonors = donorsNumDim.bottom(1)[0]["num_donors"];
    var maxDonors = donorsNumDim.top(1)[0]["num_donors"];

    var meanStudentsGroup = ndx.groupAll().reduce(
        function (p, v) {
            ++p.n;
            p.tot += v.students_reached;
            return p;
        },
        function (p, v) {
            --p.n;
            p.tot -= v.students_reached;
            return p;
        },
        function () { return {n:0,tot:0}; }
    );

    var average = function(d) { return d.n ? d.tot / d.n : 0; };

    // Records counter
    /* This counter shows the amount of records selected after applying a filter. */
    dc.dataCount('.dc-data-count')
        .dimension(ndx)
        .group(all)
        .html({
        some: '<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records',
        all: 'All records selected.'});

   //Charts
   var gradeLevelChart = dc.rowChart("#grade-chart");
   var timeChart = dc.barChart("#time-chart");
   var resourceTypeChart = dc.rowChart("#resource-type-row-chart");
   var povertyLevelChart = dc.rowChart("#poverty-level-row-chart");
   var numberProjectsND = dc.numberDisplay("#number-projects-nd");
   var totalDonationsND = dc.numberDisplay("#total-donations-nd");
   var fundingStatusChart = dc.pieChart("#funding-chart");
   var studentsProjectsND = dc.numberDisplay("#students-nd");
   var donorsProjectsND = dc.numberDisplay("#donors-nd");
   var ratioNumberProjectsND = dc.numberDisplay("#ratio-donations-nd");
    var avgStudentsProjectsND = dc.numberDisplay("#avg-students-nd");

   selectField = dc.selectMenu('#menu-select')
       .dimension(stateDim)
       .group(stateGroup);


   numberProjectsND
       .formatNumber(d3.format("d"))
       .valueAccessor(function (d) {
           return d;
       })
       .group(all);

   totalDonationsND
       .formatNumber(d3.format("d"))
       .valueAccessor(function (d) {
           return d;
       })
       .group(totalDonations)
       .formatNumber(d3.format(".3s"));

   timeChart
       .width(800)
       .height(200)
       .margins({top: 10, right: 50, bottom: 30, left: 50})
       .dimension(dateDim)
       .group(numProjectsByDate)
       .transitionDuration(500)
       .x(d3.time.scale().domain([minDate, maxDate]))
       .elasticY(true)
       .xAxisLabel("Year")
       .yAxis().ticks(4);

   resourceTypeChart
       .width(300)
       .height(250)
       .dimension(resourceTypeDim)
       .group(numProjectsByResourceType)
       .xAxis().ticks(4);

   povertyLevelChart
       .width(300)
       .height(250)
       .dimension(povertyLevelDim)
       .group(numProjectsByPovertyLevel)
       .xAxis().ticks(4);

   fundingStatusChart
       .height(220)
       .radius(90)
       .innerRadius(40)
       .transitionDuration(1500)
       .dimension(fundingStatus)
       .group(numProjectsByFundingStatus);

    // Grade Level
   gradeLevelChart
        .width(300)
        .height(220)
        .dimension(gradeLevelDim)
        .group(numProjectsByGrade)
        .xAxis().ticks(4);

    // Student Reached
   studentsProjectsND
        .valueAccessor(function (d) { return d; })
        .group(totalStudents)
        .formatNumber(d3.format(","));

   // Number of donors
   donorsProjectsND
        .valueAccessor(function (d) { return d; })
        .group(totalDonors)
        .formatNumber(d3.format(","));

   // Percentage of total
   ratioNumberProjectsND
        .formatNumber(d3.format(",.2%"))
        .valueAccessor(function (d) { return d/55000;})
        .group(all);

    // Average students reached
    avgStudentsProjectsND
        .group(meanStudentsGroup)
        .valueAccessor(average)
        .formatNumber(d3.format(".3s"));


   dc.renderAll();
}
