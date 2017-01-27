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


    events.on('delete.Cell', function(event, data) {
        update_global_result();
    });


    events.on('create.Cell', function(event, data) {
        update_global_result();
    });


    events.on('execute.CodeCell', function(event, data) {
        cell = data.cell;
        prepare_data(cell);
        cell.nbcelltesting_data.pending = true;
        delete cell.nbcelltesting_data.result_test;
        cell.celltoolbar.rebuild();
        update_global_result();
    });


    events.on('finished_execute.CodeCell', function(event, data) {
        cell = data.cell;
        prepare_data(cell);
        cell.nbcelltesting_data.pending = false;
        test_output(cell);
        cell.celltoolbar.rebuild();
        update_global_result();
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


    var status = {'pending': {'text': '<span class="fa fa-spinner fa-spin"></span>',
                              'style': 'info',
                              'cls': 'label-info ct-status-pending',
                              'count': 0,
                              'title': 'Number of pending tests'},
                  'not_available': {'text': 'no output saved',
                                    'style': 'info',
                                    'cls': 'label-info ct-status-not_available',
                                    'count': 0,
                                    'title': 'Number of cells without saved output'},
                  'failed': {'text': 'wrong output',
                             'style': 'danger',
                             'cls': 'label-danger ct-status-failed',
                             'count': 0,
                             'title': 'Number of cells with wrong output'},
                  'passed': {'text': 'correct output',
                             'style': 'success',
                             'cls': 'label-success ct-status-passed',
                             'count': 0,
                             'title': 'Number of cells with correct output'},
                 };


    var test_output = function(cell) {
        prepare_data(cell);
        var result;
        var cls;
        if (cell.nbcelltesting_data.pending === true) {
            result = 'pending';
        } else {
            comparison_result = compare_output(cell);
            if (comparison_result === null) {
                result = 'not_available';
            } else if (comparison_result === false) {
                result = 'failed';
            } else if (comparison_result === true) {
                result = 'passed';
            }
        }

        if (cell.nbcelltesting_data.result_test !== undefined) {
            if (cell.nbcelltesting_data.result_test != result) {
                cell.nbcelltesting_data.result_test = result;
            }
        } else {
            cell.nbcelltesting_data.result_test = result;
        }
    };


    var result_test = function(cell) {
        if (cell.nbcelltesting_data === undefined ||
            cell.nbcelltesting_data.result_test === undefined) {
            test_output(cell);
        }
        return cell.nbcelltesting_data.result_test;
    };


    var create_result_test = function(div, cell, celltoolbar) {
        var cell_status = result_test(cell);

        var result = status[cell_status].text;
        var cls = status[cell_status].cls;

        var element = $('<span />').addClass('label result-label').addClass(cls);
        element.append(result);

        $(div).addClass('ctb-thing result-test')
            .append(element);
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
        update_global_result();
    };


    var create_button_save = create_button('save', 'Save Output',
                                           on_save_desired_output);


    var on_reset_desired_output = function(cell, celltoolbar) {
        reset_desired_output(cell);
        test_output(cell);
        celltoolbar.rebuild();
        update_global_result();
    };


    var on_edit_nbcelltesting_metadata = edit_nbcelltesting_metadata;


    var on_test_output = function(cell, celltoolbar) {
        test_output(cell);
        celltoolbar.rebuild();
        update_global_result();
    };


    var actions = [{name: 'Reset Output', callback: on_reset_desired_output},
                   {name: 'Edit Output', callback: on_edit_nbcelltesting_metadata},
                   {name: 'Test Output', callback: on_test_output}];

    var action_callback = function(action, cell, celltoolbar) {
        return function() { action.callback(cell, celltoolbar); }
    }

    var dropdown_factory = function(div, cell, celltoolbar) {
        var dropdownButton = $('<button/>').addClass('btn btn-default btn-xs dropdown-toggle')
            .prop('type', 'button').attr('data-toggle', 'dropdown')
            .html('<span class="caret"></span>');

        var options = $('<ul/>').addClass('dropdown-menu');

        for (var action of actions) {
            var action_link = $('<a/>').prop('href', '#').html(action.name);
            action_link.on('click', action_callback(action, cell, celltoolbar));
            options.append($('<li/>').append(action_link));
        }

        $(div).addClass('ctb-thing dropdown').append(dropdownButton).append(options);
    };


    var global_status = ['passed', 'pending', 'failed', 'not_available'];


    var update_global_result = function() {
        var n = 0;
        for (var s in status) {
            status[s].count = $('.ct-status-' + s).length
            n += status[s].count;
        }
        for (var s in status) {
            $('#nbcelltesting-global-result-' + s)
                .attr('style', 'width: ' + status[s].count / n * 100 + '%')
                .html(status[s].count);
        }
    };


    events.on('preset_activated.CellToolbar', function(event, preset) {
        var element = $('#nbcelltesting-global-result');
        if (preset.name === preset_name) {
            if (element.length == 0) {
                var progress = $('<div/>')
                    .attr('id', 'nbcelltesting-global-result')
                    .addClass('progress')
                for (var s of global_status) {
                    progress.append(
                        $('<div/>')
                            .attr('id', 'nbcelltesting-global-result-' + s)
                            .addClass('progress-bar progress-bar-' + status[s].style)
                            .attr('role', 'progressbar')
                            .attr('title', status[s].title));
                }
                $("#maintoolbar-container").append(progress);
            }
            update_global_result();
            element = progress;
            element.show();
        } else {
            element.hide();
        }
    });


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
