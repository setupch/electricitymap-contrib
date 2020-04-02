import moment from 'moment';
import React, { useMemo, useState } from 'react';
import getSymbolFromCurrency from 'currency-symbol-map';
import { max as d3Max } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import { connect } from 'react-redux';
import { first } from 'lodash';

import { PRICES_GRAPH_LAYER_KEY } from '../helpers/constants';
import { getTooltipPosition } from '../helpers/graph';
import { dispatchApplication } from '../store';
import {
  getSelectedZoneHistory,
  getZoneHistoryStartTime,
  getZoneHistoryEndTime,
} from '../selectors';

import AreaGraph from './graph/areagraph';
import PriceTooltip from './tooltips/pricetooltip';

const prepareGraphData = (historyData, colorBlindModeEnabled, electricityMixMode) => {
  if (!historyData || !historyData[0]) return {};

  const currencySymbol = getSymbolFromCurrency(((first(historyData) || {}).price || {}).currency);
  const valueAxisLabel = `${currencySymbol || '?'} / MWh`;

  const priceMaxValue = d3Max(historyData.map(d => (d.price || {}).value));
  const priceColorScale = scaleLinear()
    .domain([0, priceMaxValue])
    .range(['yellow', 'red']);

  const data = historyData.map(d => ({
    [PRICES_GRAPH_LAYER_KEY]: d.price && d.price.value,
    datetime: moment(d.stateDatetime).toDate(),
    // Keep a pointer to original data
    meta: d,
  }));

  const layerKeys = [PRICES_GRAPH_LAYER_KEY];
  const layerStroke = () => 'darkgray';
  const layerFill = () => '#616161';
  const markerFill = key => d => priceColorScale(d.data[key]);

  return {
    data,
    layerKeys,
    layerStroke,
    layerFill,
    markerFill,
    valueAxisLabel,
  };
};

const mapStateToProps = state => ({
  colorBlindModeEnabled: state.application.colorBlindModeEnabled,
  electricityMixMode: state.application.electricityMixMode,
  startTime: getZoneHistoryStartTime(state),
  endTime: getZoneHistoryEndTime(state),
  historyData: getSelectedZoneHistory(state),
  isMobile: state.application.isMobile,
  selectedTimeIndex: state.application.selectedZoneTimeIndex,
});

const CountryHistoryPricesGraph = ({
  colorBlindModeEnabled,
  electricityMixMode,
  startTime,
  endTime,
  historyData,
  isMobile,
  selectedTimeIndex,
}) => {
  const [tooltip, setTooltip] = useState(null);
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(null);

  // Recalculate graph data only when the history data is changed
  const {
    data,
    layerKeys,
    layerStroke,
    layerFill,
    markerFill,
    valueAxisLabel,
  } = useMemo(
    () => prepareGraphData(historyData, colorBlindModeEnabled, electricityMixMode),
    [historyData, colorBlindModeEnabled, electricityMixMode]
  );

  // Mouse action handlers
  const mouseMoveHandler = useMemo(
    () => (timeIndex, layerIndex, getLayer, marker) => {
      dispatchApplication('selectedZoneTimeIndex', timeIndex);
      setSelectedLayerIndex(0);
      setTooltip({
        zoneData: getLayer(0).datapoints[timeIndex].data.meta,
        position: getTooltipPosition(isMobile, marker),
      });
    },
    [isMobile, setTooltip, setSelectedLayerIndex]
  );
  const mouseOutHandler = useMemo(
    () => () => {
      dispatchApplication('selectedZoneTimeIndex', null);
      setSelectedLayerIndex(null);
      setTooltip(null);
    },
    [setTooltip, setSelectedLayerIndex]
  );

  return (
    <React.Fragment>
      <AreaGraph
        data={data}
        layerKeys={layerKeys}
        layerStroke={layerStroke}
        layerFill={layerFill}
        markerFill={markerFill}
        startTime={startTime}
        endTime={endTime}
        valueAxisLabel={valueAxisLabel}
        backgroundMouseMoveHandler={mouseMoveHandler}
        backgroundMouseOutHandler={mouseOutHandler}
        layerMouseMoveHandler={mouseMoveHandler}
        layerMouseOutHandler={mouseOutHandler}
        selectedTimeIndex={selectedTimeIndex}
        selectedLayerIndex={selectedLayerIndex}
        isMobile={isMobile}
        height="6em"
      />
      {tooltip && (
        <PriceTooltip
          position={tooltip.position}
          zoneData={tooltip.zoneData}
        />
      )}
    </React.Fragment>
  );
};

export default connect(mapStateToProps)(CountryHistoryPricesGraph);
