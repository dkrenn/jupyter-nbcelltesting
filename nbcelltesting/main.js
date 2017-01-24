define([
    'require',
    'jquery',
    'base/js/namespace',
    'base/js/dialog',
    'notebook/js/celltoolbar',
    'base/js/events'

], function (require, $, Jupyter, dialog, celltoolbar, events) {

    var preset_name = 'Cell Testing';

    var CellToolbar = celltoolbar.CellToolbar;


    var prepare_data = function(cell) {
        if (cell.nbcelltesting_data === undefined) {
            cell.nbcelltesting_data = {};
        }
        if (cell.nbcelltesting_data.pending === undefined) {
            cell.nbcelltesting_data.pending = false;
        }
    };


    events.on('execute.CodeCell', function(event, data) {
        cell = data.cell;
        prepare_data(cell);
        cell.nbcelltesting_data.pending = true;
        delete cell.nbcelltesting_data.result_test;
        cell.celltoolbar.rebuild();
    });


    events.on('finished_execute.CodeCell', function(event, data) {
        cell = data.cell;
        prepare_data(cell);
        cell.nbcelltesting_data.pending = false;
        test_output(cell);
        cell.celltoolbar.rebuild();
    });


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


    var desired_output = function(cell) {
        if (cell.metadata.nbcelltesting !== undefined &&
            cell.metadata.nbcelltesting.desired_output !== undefined) {
            return cell.metadata.nbcelltesting.desired_output;
        }
        return null;
    };


    var reset_desired_output = function(cell) {
        if (cell.metadata.nbcelltesting !== undefined &&
            cell.metadata.nbcelltesting.hasOwnProperty("desired_output")) {
            delete cell.metadata.nbcelltesting.desired_output;
            cleanup_metadata(cell);
        }
    };


    var edit_nbcelltesting_metadata = function(cell, celltoolbar=null) {
        if (cell.metadata.nbcelltesting === undefined) {
            metadata = {};
        } else {
            metadata = cell.metadata.nbcelltesting;
        }

        notebook = Jupyter.notebook
        dialog.edit_metadata({
            md: metadata,
            callback: function (md) {
                prepare_metadata(cell);
                cell.metadata.nbcelltesting = md;
                test_output(cell);
                if (celltoolbar !== null) {
                    celltoolbar.rebuild();
                }
            },
            name: 'Cell Testing',
            notebook: notebook,
            keyboard_manager: notebook.keyboard_manager});
    };


    var compare_output = function(cell) {
        dout = desired_output(cell);
        if (dout === null) {
            return null;
        }
        cout = cell_output(cell);
        return cout === dout;
    };


    var test_output = function(cell) {
        prepare_data(cell);
        var result;
        var cls;
        if (cell.nbcelltesting_data.pending === true) {
            result = "<span class='fa fa-spinner fa-spin'></span>";
            cls = 'label-info';
        } else {
            comparison_result = compare_output(cell);
            if (comparison_result === null) {
                result = 'no output saved';
                cls = 'label-info';
            } else if (comparison_result === false) {
                result = 'test failed';
                cls = 'label-danger';
            } else if (comparison_result === true) {
                result = 'test passed';
                cls = 'label-success';
            }
        }
        var result_test = $('<span />').addClass('label result-label').addClass(cls);
        result_test.append(result);

        cell.nbcelltesting_data.result_test = result_test;
    };


    var create_result_test = function(div, cell, celltoolbar) {
        if (cell.nbcelltesting_data === undefined ||
            cell.nbcelltesting_data.result_test === undefined) {
            test_output(cell);
        }

        $(div).addClass('ctb-thing result-test')
            .append(cell.nbcelltesting_data.result_test);
    };


    var create_button = function(name, value, callback) {
        return function(div, cell, celltoolbar) {
            var button = $('<button/>').addClass('btn btn-default btn-xs')
                .addClass('button-' + name)
                .prop('type', 'button')
                .html(value);
            button.name = name;
            button.on('click', function() { callback(cell, celltoolbar) });
            $(div).addClass('ctb-thing').append(button);
        };
    };


    var on_save_desired_output = function(cell, celltoolbar) {
        save_desired_output(cell);
        test_output(cell);
        celltoolbar.rebuild();
    };


    var create_button_save = create_button('save', 'Save Output',
                                           on_save_desired_output);


    var on_reset_desired_output = function(cell, celltoolbar) {
        reset_desired_output(cell);
        test_output(cell);
        celltoolbar.rebuild();
    };


    var on_edit_nbcelltesting_metadata = edit_nbcelltesting_metadata;


    var on_test_output = function(cell, celltoolbar) {
        test_output(cell);
        celltoolbar.rebuild();
    };


    var actions = [{name: 'Reset Output', callback: on_reset_desired_output},
                   {name: 'Edit Output', callback: on_edit_nbcelltesting_metadata},
                   {name: 'Test Output', callback: on_test_output}];


    var dropdown_factory = function(div, cell, celltoolbar) {
        var dropdownButton = $('<button/>').addClass('btn btn-default btn-xs dropdown-toggle')
            .prop('type', 'button').attr('data-toggle', 'dropdown')
            .html('<span class="caret"></span>');

        var options = $('<ul/>').addClass('dropdown-menu');

        for (let action of actions) {
            var action_link = $('<a/>').prop('href', '#').html(action.name);
            action_link.on('click', function() { action.callback(cell, celltoolbar) });
            options.append($('<li/>').append(action_link));
        }

        $(div).addClass('ctb-thing dropdown').append(dropdownButton).append(options);
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
        CellToolbar.register_callback('nbcelltesting.dropdown_menu', dropdown_factory);

        var preset = [
            'nbcelltesting.result_test',
            'nbcelltesting.button_save',
            'nbcelltesting.dropdown_menu',
        ];
        CellToolbar.register_preset(preset_name, preset, Jupyter.notebook);
        console.log('nbcelltesting extension loaded.');
    }


    return {
        load_ipython_extension: load_extension
    };
});
