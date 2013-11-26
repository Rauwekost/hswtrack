<script id="home-template" type="text/x-handlebars-template">
  {{#weight}}
  <p>Hi {{../login}}!</p>
  <p>Your weight today: {{{round ../weight 1}}} kg  <button id="weight-clear-btn" class="btn btn-default btn-xs">Clear</button>
</p>
  {{/weight}}

  {{^weight}}
  <div class="well">
    <p>Hi {{login}}!  Please enter your weight (kg):</p>
    <input type="number" id="weight-input" placeholder="Enter weight.."></input>
    <button id="weight-input-btn" class="btn btn-primary">Save</button>
  </div>
  {{/weight}}

  <div class="row">
    <div id="weight-plot" class="col-md-12"></div>
  </div>

  <div class="btn-group" data-toggle="buttons">
    <label class="btn btn-default btn-sm" id="graph-3-mo">
      <input type="radio" name="graph-range"><small>3 months</small>
    </label>
    <label class="btn btn-default btn-sm" id="graph-12-mo">
      <input type="radio" name="graph-range"><small>12 months</small>
    </label>
    <label class="btn btn-default btn-sm" id="graph-24-mo">
      <input type="radio" name="graph-range"><small>24 months</small>
    </label>
    <label class="btn btn-default btn-sm" id="graph-all">
      <input type="radio" name="graph-range"><small>Lifetime</small>
    </label>
  </div>

</script>

<script id="settings-template" type="text/x-handlebars-template">
  Settings for {{login}}
</script>
