
function Workout() {
    this.mainTemplate = Handlebars.compile($("#workouts-template").html());
    this.workoutTemplate = Handlebars.compile($("#workout-template").html());
    this.exerciseTemplate = Handlebars.compile($("#exercise-template").html());
    this.addExerciseTemplate = Handlebars.compile($("#add-exercise-template").html());
    this.addExerciseSetsTemplate = Handlebars.compile($("#add-exercise-sets-template").html());
    Handlebars.registerPartial("addSetControl", $("#add-set-control-partial").html());
};


var assert = function(condition, message) {
    if (!condition)
        throw Error("Assert failed" + (typeof message !== "undefined" ? ": " + message : ""));
};

Workout.prototype._loadExerciseTypes = function () {
    return $.ajax({
        type: "GET",
        url: "/rest/exercise"
    });
};

Workout.prototype._loadWorkouts = function () {
    return $.ajax({
        type: "GET",
        url: "/rest/workout"
    });
};

Workout.prototype._attachAddExercise = function (elt, renderCallback, workoutId, exerciseId) {
    var self = this;

    $("form.add-set", elt).each(function () {
        var form = this;
        $("button", this).click(function (e) {
            e.preventDefault();
            var reps   = $("input.reps", form).val();
            var weight = $("input.weight", form).val();

            assert(reps != '');
            assert(weight != '');

            var data = {
                reps: reps,
                weight: weight,
                exerciseId: exerciseId,
                workoutId: workoutId
            };

            $.ajax({ url: "/rest/workout/exercise",
                     type: "POST",
                     data: data,
                     success: renderCallback
                   });
        });
    });
};

Workout.prototype._renderExercise = function (elt, workoutId, exercise) {
    var self = this;
    $(elt).html(self.exerciseTemplate(exercise));

    var render = function (resp) {
        self._renderExercise(elt, workoutId, resp);
    };

    this._attachAddExercise(elt, render, workoutId, exercise.exerciseId);
};

Workout.prototype._renderWorkout = function (elt, workout) {
    var self = this;

    $(elt).html(self.workoutTemplate(workout));

    $(".exercise", elt).each(function (exerciseIdx) {
        var exercise = workout.exercises[exerciseIdx];
        self._renderExercise(this, workout.id, exercise);
    });

    $("div.add-exercise", elt).html(self.addExerciseTemplate( {exerciseTypes: self.exerciseTypes} ));
    $("select.select-exercise", elt).click(function () {
        var selectedExerciseId = $(this).val();
        var addExerciseScope = $(".add-exercise-sets", elt);
        addExerciseScope.html(self.addExerciseSetsTemplate( {exerciseTypes: self.exerciseTypes} ));

        var render = function (resp) {
            // Reload workout & rerender
            $.ajax({ url: "/rest/workout",
                     type: "GET",
                     data: { id: workout.id },
                     success: function (workoutResp) {
                         self._renderWorkout(elt, workoutResp);
                     }
                   });
        };
        self._attachAddExercise(addExerciseScope, render, workout.id, selectedExerciseId);
    });
};

Workout.prototype._renderWorkouts = function (ws) {
    var self = this;
    var workouts = { workouts: ws };

    $("#app-container").html(self.mainTemplate(workouts));

    $(".workout").each(function (workoutIdx) {
        var workout = workouts.workouts[workoutIdx];
        self._renderWorkout(this, workout);
    });

    $("button#new-workout").click(function (elt) {
        $.ajax( { url: "/rest/workout",
                  type: "POST",
                  data: [],
                  success: function (resp) {
                      self._renderWorkouts(resp);
                  }
                });
    });
};

Workout.prototype.render = function () {
    var self = this;

    $.when(this._loadWorkouts(), this._loadExerciseTypes()).done(function (ws, es) {
        self.exerciseTypes = es[0];
        self._renderWorkouts(ws[0]);
    });
};
