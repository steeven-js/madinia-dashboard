import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

import { fileThumbnailClasses } from './classes';
import { fileData, fileThumb, fileFormat } from './utils';
import { RemoveButton, DownloadButton } from './action-buttons';

// ----------------------------------------------------------------------

export function FileThumbnail({
  sx,
  file,
  tooltip,
  onRemove,
  imageView,
  slotProps,
  onDownload,
  className,
  ...other
}) {
  const isUrl = typeof file === 'string';
  const previewUrl = isUrl ? file : URL.createObjectURL(file);

  const { name } = fileData(file);

  // Pour les URLs, on force le format image
  const format = isUrl ? 'image' : fileFormat(previewUrl);

  const renderImg = (
    <Box
      component="img"
      src={previewUrl}
      className={fileThumbnailClasses.img}
      sx={{
        width: 1,
        height: 1,
        objectFit: 'cover',
        borderRadius: 'inherit',
        ...slotProps?.img,
      }}
    />
  );

  const renderIcon = (
    <Box
      component="img"
      src={fileThumb(format)}
      className={fileThumbnailClasses.icon}
      sx={{ width: 1, height: 1, ...slotProps?.icon }}
    />
  );

  const renderContent = (
    <Box
      component="span"
      className={fileThumbnailClasses.root.concat(className ? ` ${className}` : '')}
      sx={{
        width: 36,
        height: 36,
        flexShrink: 0,
        borderRadius: 1.25,
        alignItems: 'center',
        position: 'relative',
        display: 'inline-flex',
        justifyContent: 'center',
        ...sx,
      }}
      {...other}
    >
      {format === 'image' && imageView ? renderImg : renderIcon}

      {onRemove && (
        <RemoveButton
          onClick={() => onRemove(file)}
          className={fileThumbnailClasses.removeBtn}
          sx={slotProps?.removeBtn}
        />
      )}

      {onDownload && (
        <DownloadButton
          onClick={() => onDownload(file)}
          className={fileThumbnailClasses.downloadBtn}
          sx={slotProps?.downloadBtn}
        />
      )}
    </Box>
  );

  if (tooltip) {
    return (
      <Tooltip
        arrow
        title={name}
        slotProps={{
          popper: {
            modifiers: [{ name: 'offset', options: { offset: [0, -12] } }],
          },
        }}
      >
        {renderContent}
      </Tooltip>
    );
  }

  return renderContent;
}
