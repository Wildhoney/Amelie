/** @jsx React.DOM */

(function main($document, $react, $d3) {

    "use strict";

    /**
     * @module Amelie
     * @author Adam Timberlake
     * @link https://github.com/Wildhoney/Amelie
     */
    var Amelie = $react.createClass({

        /**
         * @method componentDidMount
         * @return {void}
         */
        componentDidMount: function componentDidMount() {

            // Once the component has been rendered we can listen for the "canplay" event to setup
            // the audio context to begin analysing the audio stream.
            this.getAudioElement().addEventListener('canplay', this.configureAudioContext);

        },

        /**
         * @method getInitialState
         * @returns {Object}
         */
        getInitialState: function getInitialState() {
            return { analyser: null };
        },

        /**
         * @method getAudioElement
         * @return {HTMLElement}
         */
        getAudioElement: function getAudioElement() {
            return this.getDOMNode().querySelector('audio');
        },

        /**
         * @method configureAudioContext
         * @return {void}
         */
        configureAudioContext: function configureAudioContext() {

            // Dependencies for analysing the audio stream.
            var context  = new AudioContext() || webkitAudioContext(),
                analyser = context.createAnalyser();

            // Route the audio source through our visualiser.
            var source = context.createMediaElementSource(this.getAudioElement());
            source.connect(analyser);

            // Create the analyser object.
            analyser.connect(context.destination);
            analyser.fftSize = 128;

            // ...And now we can begin the visualisation rendering!
            this.setState({ analyser: analyser });

        },

        /**
         * @method render
         * @return {XML}
         */
        render: function render() {

            return (
                React.DOM('section', {className: "amelie"}, [
                    React.DOM('audio', {controls: "controls", autoPlay: "autoplay", src:  this.props.audio}),
                    Visualiser({analyser:  this.state.analyser})
                ])
            );

        }

    });

    /**
     * @module Amelie
     * @submodule Visualiser
     * @author Adam Timberlake
     * @link https://github.com/Wildhoney/Amelie
     */
    var Visualiser = $react.createClass({

        /**
         * @method componentWillReceiveProps
         * @param nextProps {Object}
         * @return {void}
         */
        componentWillReceiveProps: function componentWillReceiveProps(nextProps) {

            if (nextProps.analyser) {

                // We have the `AnalyserNode` and therefore we're ready to analyse the
                // audio track.
                this.analyseAudioStream(nextProps.analyser);

            }

        },

        /**
         * @method getInitialState
         * @returns {Object}
         */
        getInitialState: function getInitialState() {
            return { cursor: { x: 0, y: 0 }, frequencyData: [] };
        },

        /**
         * @method analyseAudioStream
         * @param analyser {AnalyserNode}
         * @return {void}
         */
        analyseAudioStream: function anaylseAudioStream(analyser) {

            // Round and round we go...
            (requestAnimationFrame || webkitRequestAnimationFrame)(function() {
                anaylseAudioStream.call(this, analyser);
            }.bind(this));

            // Analyse the frequency data for the current audio track!
            var frequencyData = new Uint8Array(analyser.frequencyBinCount);

            analyser.getByteFrequencyData(frequencyData);
            //analyser.getByteTimeDomainData(frequencyData);

            // Create another circle...
            //this.renderCircles(frequencyData);
            this.setState({ frequencyData: frequencyData, fftSize: analyser.fftSize });

        },

        /**
         * @method setCursorPosition
         * @param event {Object}
         * @return {void}
         */
        setCursorPosition: function setCursorPosition(event) {
            this.setState({ cursor: { x: event.clientX, y: event.clientY } });
        },

        /**
         * @method render
         * @return {XML}
         */
        render: function render() {

            return (
                React.DOM('section', {className: "visualiser", onMouseMove: this.setCursorPosition}, [
                    Canvas({frequencyData: this.state.frequencyData, 
                            cursor: this.state.cursor, 
                            fftSize: this.state.fftSize})
                ])
            );

        }

    });


    /**
     * @module Amelie
     * @submodule Canvas
     * @author Adam Timberlake
     * @link https://github.com/Wildhoney/Amelie
     */
    var Canvas = $react.createClass({

        /**
         * @method componentDidMount
         * @return {void}
         */
        componentDidMount: function componentDidMount() {

            // Configure the D3 SVG component.
            var d3Element = $d3.select(this.getDOMNode())
                               .append('svg')
                               .attr('width', this.state.size[0])
                               .attr('height', this.state.size[1])
                               .append('g');

            this.getDOMNode().style.width  = this.state.size[0] + 'px';
            this.getDOMNode().style.height = this.state.size[1] + 'px';

            this.setState({ d3: d3Element, colours: $d3.scale.category20b() });

        },

        /**
         * @method componentWillReceiveProps
         * @param nextProps {Object}
         * @return {void}
         */
        componentWillReceiveProps: function componentWillReceiveProps(nextProps) {

            if (this.state.circles.length === 0 && nextProps.fftSize) {

                // We know the `fftSize` and can therefore pre-render the required number of
                // circles to quicken the rendering.
                this.setState({ circles: this.createCircles(nextProps.fftSize) });

            }

        },

        /**
         * @method createCircles
         * @param amountOfCircles {Number}
         * @return {Array}
         */
        createCircles: function createCircles(amountOfCircles) {

            var circles = [];

            for (var index = 0; index < amountOfCircles; index++) {
                circles.push(this.state.d3.append('circle'));
            }

            return circles;

        },

        /**
         * @method getInitialState
         * @returns {Object}
         */
        getInitialState: function getInitialState() {
            return { circles: [], colours: function noop() {}, size: [250, 250] };
        },

        /**
         * @method renderCircles
         * @param frequencyData {Uint8Array}
         * @return {void}
         */
        renderCircles: function renderCircles(frequencyData) {

            if (this.state.circles.length === 0) {

                // Circles haven't yet been pre-rendered and therefore we're unable to go
                // any further.
                return;

            }

            var colours = this.state.colours;

            for (var index = 0, maxLength = frequencyData.length; index < maxLength; index++) {

                this.state.circles[index].attr('cx', this.state.size[0] - 60).attr('cy', this.state.size[1] - 60)
                                         .attr('r', frequencyData[index] / 5)
                                         .style('fill', colours(index));

            }

        },

        /**
         * @method positionDOMElement
         * @param cursorData {Object}
         * @return {void}
         */
        positionDOMElement: function positionDOMElement(cursorData) {
            this.getDOMNode().style.left = (cursorData.x - (this.state.size[0] / 2)) + 'px';
            this.getDOMNode().style.top  = (cursorData.y - (this.state.size[1] / 2)) + 'px';
        },

        /**
         * @method render
         * @return {XML}
         */
        render: function render() {

            if (this.props.frequencyData) {

                // We're ready to begin rendering the circles for this particular canvas element.
                this.renderCircles(this.props.frequencyData);

                if (this.state.d3) {
                    this.positionDOMElement(this.props.cursor);
                }

            }

            return (
                React.DOM('div', {className: "canvas-container"})
            );

        }

    });

    // It's time to throw everything to the devil and go to Kislovodsk...
    var amelieNode = $document.querySelector('amelie');
    $react.render(Amelie({audio: amelieNode.getAttribute('data-audio')}), amelieNode);

})(window.document, window.React, window.d3);