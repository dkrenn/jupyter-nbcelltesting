define([
    'require',
    'jquery',
    'base/js/namespace',
    'base/js/dialog',
    'notebook/js/celltoolbar',
    'base/js/events'

], function (require, $, Jupyter, dialog, celltoolbar, events) {

    var preset_name = "Cell Testing";

    var CellToolbar = celltoolbar.CellToolbar;


    var prepare_metadata = function(cell) {
        if (cell.metadata.nbcelltesting === undefined) {
            cell.metadata.nbcelltesting = {};
        }
    };


    var cleanup_metadata = function(cell) {
        if (cell.metadata.nbcelltesting !== undefined &&
            Object.keys(cell.metadata.nbcelltesting).length === 0) {
            delete cell.metadata.nbcelltesting
        }
    };


    var cell_output = function(cell) {
        pre = cell.output_area.element.find('div.output_subarea').last().find('pre');
        return pre.text();
    };


    var save_desired_output = function(cell) {
        prepare_metadata(cell);
        cell.metadata.nbcelltesting.desired_output = cell_output(cell);
    };


    var reset_desired_output = function(cell) {
        if (cell.metadata.nbcelltesting !== undefined &&
            cell.metadata.nbcelltesting.hasOwnProperty("desired_output")) {
            delete cell.metadata.nbcelltesting.desired_output;
            cleanup_metadata(cell);
        }
    };


    var create_result_test = function(div, cell, celltoolbar) {
        var result = $('<a />').addClass('result-test')
        result.append('x');
        $(div).addClass('result-test-container').append(result);
    };


    var create_button_save = function(div, cell, celltoolbar) {
        var save = document.createElement("input");
        save.type = 'button';
        save.name = 'save';
        save.value = 'Save Output';
        save.onclick = function() {
            save_desired_output(cell);
        };
        $(div).addClass('button-save-container').append(save);
    };


    var create_button_reset = function(div, cell, celltoolbar) {
        var reset = document.createElement("input");
        reset.type = 'button';
        reset.name = 'reset';
        reset.value = 'Reset Output';
        reset.onclick = function() {
            reset_desired_output(cell);
        };
        $(div).addClass('button-reset-container').append(reset);
    };
  

    var load_css = function () {
        var link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = require.toUrl('./nbcelltesting.css');
        document.getElementsByTagName('head')[0].appendChild(link);
    };


    function load_extension(){
        load_css();

        CellToolbar.register_callback('nbcelltesting.result_test', create_result_test);
        CellToolbar.register_callback('nbcelltesting.button_save', create_button_save);
        CellToolbar.register_callback('nbcelltesting.button_reset', create_button_reset);

        var preset = [
            'nbcelltesting.result_test',
            'nbcelltesting.button_save',
            'nbcelltesting.button_reset',
        ];
        CellToolbar.register_preset(preset_name, preset, Jupyter.notebook);
        console.log('nbcelltesting extension loaded.');
    }


    return {
        load_ipython_extension: load_extension
    };
});









