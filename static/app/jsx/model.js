define(['jquery', 'underscore', 'app/class'], function($, _, obj) {
  "use strict";

  var Class = obj.Class;

  function calcExerciseStats(e) {
    if (e.type == "BW") {
      return _.reduce(e.sets, function (a, s) { return a+s.reps; }, 0);
    }
    else if (e.type == "W") {
      return _.reduce(e.sets, function (a, s) { return a+s.reps*s.weight; }, 0);
    }
    console.error("unknown type "+e.type);
  }

  function loadExerciseTypes() {
    return $.ajax({
      type: "GET",
      url: "/rest/exercise"
    });
  }

  function loadWorkout(id) {
    return $.ajax({
      type: "GET",
      url: "/rest/workout",
      data: { id: id }
    });
  }

  var ExerciseModel = Class.extend({
    init: function() {
      this.exercises  = [];
      this.setStateCB = null;
    },

    load: function (cb) {
      $.when(loadExerciseTypes())
          .done(function (data) {
            this.exercises = data.payload;
            this.setStateCB(this);
          }.bind(this));
    },

    add: function (e) {
      $.ajax({
        url: "/rest/exercise",
        type: "POST",
        data: e,
        success: function (resp) {
          this.exercises = this.exercises.concat([resp.payload]);
          this.setStateCB(this);
        }.bind(this),
        error: function(xhr, status, err) {
          console.error("/rest/exercise", status, err.toString());
        }.bind(this)
      });
    }
  });

  var WorkoutModel = Class.extend({
    init: function(id) {
      this.workout = { id: id, exercises: [] };
      this.exerciseTypes = [];
      this.setStateCB = null;
    },

    load: function (cb) {
      $.when(loadWorkout(this.workout.id), loadExerciseTypes())
          .done(function (w, e) {
            this.workout = w[0].payload;
            this.exerciseTypes = e[0].payload;
            this.setStateCB(this);
          }.bind(this));
    },

    addSet: function (params) {
      $.ajax({ url: "/rest/workout/exercise",
              type: "POST",
              data: params,
              success: function (resp) {
                this.load(); // FIXME just force reloading the whole thing now
              }.bind(this)
      });
    },

    rmSet: function (params) {
      $.ajax({ url: "/rest/workout/exercise",
              type: "DELETE",
              data: params,
              success: function (resp) {
                this.load(); // FIXME just force reloading the whole thing now
              }.bind(this)
      });
    },

  });

  return {
    'calcExerciseStats': calcExerciseStats,
    'ExerciseModel': ExerciseModel,
    'WorkoutModel': WorkoutModel,
  };
});
